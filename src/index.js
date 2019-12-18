import path from 'path'
import appEventConfig from './appEventConfig'

// 私有方法
// let downloadOneByOne = Symbol('downloadOneByOne')
// let sendDownloadProgress = Symbol('sendDownloadProgress')
// let sendDownloadFaild = Symbol('sendDownloadFaild')
// let sendDownloadFileSuccess = Symbol('sendDownloadFileSuccess')
// let sendDownloadSuccess = Symbol('sendDownloadSuccess')
// let initDownloadProgress = Symbol('initDownloadProgress')
// let setCurrentDownloadItem = Symbol('setCurrentDownloadItem')
// let getDownloadMode = Symbol('getDownloadMode')
// let sendDownloadPause = Symbol('sendDownloadPause')
// let sendDownloadInterrupted = Symbol('sendDownloadInterrupted')
// let deleteSerialFileByDownloadUrl = Symbol('deleteSerialFileByDownloadUrl')
// let existSerialWaitDownloadArr = Symbol('existSerialWaitDownloadArr')
let downloadOneByOne = 'downloadOneByOne'
let sendDownloadProgress = 'sendDownloadProgress'
let sendDownloadFaild = 'sendDownloadFaild'
let sendDownloadFileSuccess = 'sendDownloadFileSuccess'
let sendDownloadSuccess = 'sendDownloadSuccess'
let initDownloadProgress = 'initDownloadProgress'
let setCurrentDownloadItem = 'setCurrentDownloadItem'
let getDownloadMode = 'getDownloadMode'
let sendDownloadPause = 'sendDownloadPause'
let sendDownloadInterrupted = 'sendDownloadInterrupted'
let deleteSerialFileByDownloadUrl = 'deleteSerialFileByDownloadUrl'
let existSerialWaitDownloadArr = 'existSerialWaitDownloadArr'
let fileExistDownliadList = 'fileExistDownliadList'
let addDownloadFileSuccess = 'addDownloadFileSuccess'

/*
* 下载服务
* */
class DownloadService {
  // 串行下载池
  serialWaitDownloadArr = []
  // 下载对象池
  allDownloadFiles = {}
  // 当前下载对象池
  currentDownloadItems = {}
  // 窗口集合对象
  allWindows = {}
  // 触发下载的进程
  downloadWindow = null
  // 下载状态选项
  downloadStatus = {
    WAITING: 'waiting',
    DOWNLOADING: 'downloading',
    PAUSE: 'pause'
  }

  /**
   * downloadWindow: hiddenWindow (触发下载功能的进程)
   * */
  init(downloadWindow) {
    this.downloadWindow = downloadWindow
    this[initDownloadProgress]()
  }

  // 下载进度
  [initDownloadProgress]() {
    let that = this
    let timer = setInterval(() => {
      if (this.downloadWindow) {
        this.downloadWindow.webContents.session.addListener('will-download', (event, item) => {
          if (!that.allDownloadFiles[item.getURL()]) return
          that[setCurrentDownloadItem](item)
          item.setSavePath(path.join(that.allDownloadFiles[item.getURL()].downloadFolder, that.allDownloadFiles[item.getURL()].downloadFileName || item.getFilename()))
          item.on('updated', (event, state) => {
            // 下载已经中断，可以恢复
            if (state === 'interrupted') {
              console.log('下载已经中断，可以恢复')
              that[sendDownloadInterrupted](item.getReceivedBytes(), item.getTotalBytes(), JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])))
            }
            // 下载暂停
            if (state === 'progressing' && item.isPaused()) {
              console.log('下载暂停')
              that[sendDownloadPause](item.getReceivedBytes(), item.getTotalBytes(), JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])))
            }
            // 正在下载
            if (state === 'progressing' && !item.isPaused()) {
              console.log(item.getURL(), item.getReceivedBytes(), item.getTotalBytes())
              that[sendDownloadProgress](item.getReceivedBytes(), item.getTotalBytes(), JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])))
            }
          })
          item.on('done', (event, state) => {
            // 下载成功完成s
            if (state === 'completed') {
              that[sendDownloadFileSuccess](JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])), item.getTotalBytes())
              // 串行下载
              if (that[getDownloadMode](item.getURL()) === 'serial') {
                // 从串行下载池当中移除当前下载完成的文件
                that[deleteSerialFileByDownloadUrl](item.getURL())
                // 串行下载池完全下载完毕
                if (!that.serialWaitDownloadArr.length) that[sendDownloadSuccess](JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])))
                // 串行下载池队列下载
                if (that.serialWaitDownloadArr.length) that[downloadOneByOne]()
              }
            }
            // 下载已被取消 || 下载已经中断，无法恢复
            if (state === 'cancelled' || state === 'interrupted') {
              that[sendDownloadFaild](state, JSON.parse(JSON.stringify(that.allDownloadFiles[item.getURL()])))
              // 串行下载
              if (that[getDownloadMode](item.getURL()) === 'serial') {
                // 从串行下载池当中移除当前下载失败的文件
                that[deleteSerialFileByDownloadUrl](item.getURL())
                // 串行下载池队列下载
                if (that.serialWaitDownloadArr.length > 1 && !that.isSerialDownloading()) that[downloadOneByOne]()
              }
            }
            // 从当前下载对象池当中移除
            delete that.currentDownloadItems[item.getURL()]
          })
        })
        this.downloadWindow.on('closed', () => {
          downloadService.cancelAll()
        })
        clearInterval(timer)
      }
    }, 40)
  }

  /**
   * 挂载窗口集合对象
   * appWindows: {
   *  loginWindow: new BrowserWindow(),
   *  indexWindow: new BrowserWindow(),
   *  hiddenWindow: new BrowserWindow()
   * }
   * */
  addWindows(appWindows = {}) {
    Object.keys(appWindows).forEach(appWindow => {
      if (!this.allWindows[appWindow]) this.allWindows[appWindow] = appWindows[appWindow]
    })
  }

  // 初始化当前下载项目
  [setCurrentDownloadItem](downloadItem) {
    this.currentDownloadItems[downloadItem.getURL()] = downloadItem
  }

  // 取消部分下载
  cancel(fileList) {
    if (Object.keys(this.currentDownloadItems).length <= 0) return
    // 参数必须是数组
    if (!Array.prototype.isPrototypeOf(fileList)) return
    // 从串行下载池当中移除
    fileList.forEach(cancelFile => {
      this.serialWaitDownloadArr.forEach((serialWaitDownloadFile, index) => {
        if (serialWaitDownloadFile.url === cancelFile) {
          this.serialWaitDownloadArr.splice(index, 1)
        }
      })
    })
    // 取消下载
    fileList.forEach(cancelFile => {
      if (Object.keys(this.currentDownloadItems).includes(cancelFile)) {
        // cancel下载
        this.currentDownloadItems[cancelFile].cancel()
        // 从当前下载对象池当中移除
        delete this.currentDownloadItems[cancelFile]
      }
    })
    // 如果当前串行下载池没有文件在下载，就执行串行下载池队列
    if (!this.isSerialDownloading()) this[downloadOneByOne]()
  }

  // 取消全部下载
  cancelAll() {
    let serialWaitDownloadFiles = []
    this.serialWaitDownloadArr.forEach(serialWaitDownloadFile => {
      serialWaitDownloadFiles.push(serialWaitDownloadFile.url)
    })
    this.cancel([...new Set([...Object.keys(this.currentDownloadItems), ...serialWaitDownloadFiles])])
  }

  /**
   * 暂停下载
   * fileList: [url, url]
   * */
  pause(pauseFileList) {
    pauseFileList.forEach(pauseFile => {
      // 设置下载状态为停止
      if (this.allDownloadFiles[pauseFile]) this.allDownloadFiles[pauseFile]._status = this.downloadStatus.PAUSE
      // 当前下载对象池设置停止
      if (Object.keys(this.currentDownloadItems).includes(pauseFile)) this.currentDownloadItems[pauseFile].pause()
    })
    // 如果当前串行下载池没有文件在下载，就执行串行下载池队列
    if (!this.serialWaitDownloadArr.length) return
    if (!this.isSerialDownloading()) this[downloadOneByOne]()
  }

  // 暂停全部下载
  pauseAll() {
    let serialWaitDownloadFiles = []
    this.serialWaitDownloadArr.forEach(serialWaitDownloadFile => {
      serialWaitDownloadFiles.push(serialWaitDownloadFile.url)
    })
    this.pause([...new Set([...Object.keys(this.currentDownloadItems), ...serialWaitDownloadFiles])])
  }

  // 暂停恢复
  resume(resumeFileList) {
    for (let i = 0; i < resumeFileList.length; i++) {
      let isSerialWaitDownloadFile = this[existSerialWaitDownloadArr](resumeFileList[i])
      let isCurrentDownloadFile = Object.keys(this.currentDownloadItems).includes(resumeFileList[i])
      // 拦截已经正在下载
      if (
        isCurrentDownloadFile &&
        this.allDownloadFiles[resumeFileList[i]]._status === this.downloadStatus.DOWNLOADING
      ) continue
      // 恢复并行下载文件
      if (
        isCurrentDownloadFile &&
        this.allDownloadFiles[resumeFileList[i]]._status === this.downloadStatus.PAUSE &&
        this.currentDownloadItems[resumeFileList[i]].canResume()
      ) {
        this.allDownloadFiles[resumeFileList[i]]._status = this.downloadStatus.DOWNLOADING
        this.currentDownloadItems[resumeFileList[i]].resume()
        continue
      }
      // 恢复非当前串行下载文件的waiting状态
      if (isSerialWaitDownloadFile) this.allDownloadFiles[resumeFileList[i]]._status = this.downloadStatus.WAITING
      // 恢复当前下载的文件
      if (
        isSerialWaitDownloadFile &&
        isCurrentDownloadFile &&
        this.currentDownloadItems[resumeFileList[i]].canResume()
      ) {
        this.allDownloadFiles[resumeFileList[i]]._status = this.downloadStatus.DOWNLOADING
        this.currentDownloadItems[resumeFileList[i]].resume()
      }
      // 执行串行下载池队列
      if (
        isSerialWaitDownloadFile &&
        this.allDownloadFiles[resumeFileList[i]]._status === this.downloadStatus.WAITING &&
        !this.isSerialDownloading()
      ) {
        this[downloadOneByOne](resumeFileList[i])
      }
    }
  }

  // 判断串行下载池是否有文件正在下载
  isSerialDownloading() {
    let serialDownloading = false
    this.serialWaitDownloadArr.forEach(waitDownloadFile => {
      if (waitDownloadFile._status === this.downloadStatus.DOWNLOADING) serialDownloading = true
    })
    return serialDownloading
  }

  // 当前正在下载的文件
  getCurrentDownloading() {
    let currentDownloadingFiles = []
    Object.keys(this.currentDownloadItems).forEach(fileUrl => {
      currentDownloadingFiles.push(this.allDownloadFiles[fileUrl])
    })
    return JSON.parse(JSON.stringify(currentDownloadingFiles))
  }

  // 是否有文件正在下载
  isDownloading() {
    if (!Object.keys(this.currentDownloadItems).length) return false
    if (Object.keys(this.currentDownloadItems).length) return true
  }

  // 还有多少文件未完成下载
  waitDownloadLength() {
    return this.serialWaitDownloadArr.length
  }

  // 获取串行下载池
  getWaitDownloadFiles() {
    return JSON.parse(JSON.stringify(this.serialWaitDownloadArr))
  }

  /**
   * 添加下载文件
   * downloadFiles: [{
      url: 'https://test-cdn.vipthink.cn/video/class/course_share_201910301510.zip', 下载资源路径
      downloadFolder: 'C:\\Users\\caozhenhui\\Desktop', 保存到哪里
      downloadFileName: 'abc.zip', 保存下来的文件名称（可选）
      downloadMode: 'serial', serial（串行）、parallel（并行）
      window: 'indexWindow' 回调给哪个渲染进程
     }]
   * */
  download(downloadFiles) {
    if (!Array.prototype.isPrototypeOf(downloadFiles)) return
    // 添加下载状态
    for (let i = 0; i < downloadFiles.length; i++) {
      // 如果已经在下载或存在下载列表当中，则忽略
      if (
        Object.keys(this.currentDownloadItems).includes(downloadFiles[i].url) ||
        this[existSerialWaitDownloadArr](downloadFiles[i].url)
      ) {
        this[fileExistDownliadList](downloadFiles[i])
        continue
      }
      downloadFiles[i]._status = this.downloadStatus.WAITING
      if (downloadFiles[i].downloadMode === 'serial') this.serialWaitDownloadArr = [...this.serialWaitDownloadArr, downloadFiles[i]]
      this.allDownloadFiles[downloadFiles[i].url] = downloadFiles[i]
      this[addDownloadFileSuccess](downloadFiles[i])
      if (
        downloadFiles[i].downloadMode === 'serial' &&
        this.isSerialDownloading()
      ) continue
      this[downloadOneByOne](downloadFiles[i].url)
    }
  }

  // 根据下载url删除串行下载池的某一项
  [deleteSerialFileByDownloadUrl](downloadUrl) {
    for (let i = 0; i < this.serialWaitDownloadArr.length; i++) {
      if (this.serialWaitDownloadArr[i].url === downloadUrl) {
        this.serialWaitDownloadArr.splice(i, 1)
        break
      }
    }
  }

  // 根据下载url判断文件是否存在于串行下载池
  [existSerialWaitDownloadArr](downloadUrl) {
    let exist = false
    for (let i = 0; i < this.serialWaitDownloadArr.length; i++) {
      if (this.serialWaitDownloadArr[i].url === downloadUrl) {
        exist = true
        break
      }
    }
    return exist
  }

  /**
   * 获取文件下载方式
   * return serial、parallel
   * */
  [getDownloadMode](downloadUrl) {
    return this.allDownloadFiles[downloadUrl].downloadMode
  }

  // 排队下载文件
  [downloadOneByOne](downloadFirst) {
    if (downloadFirst && this.allDownloadFiles[downloadFirst].downloadMode === 'parallel') {
      this.downloadWindow.webContents.downloadURL(this.allDownloadFiles[downloadFirst].url)
      this.allDownloadFiles[downloadFirst]._status = downloadService.downloadStatus.DOWNLOADING
      return
    }
    // 优先下载的文件，排到串行下载池的第一位
    if (downloadFirst) {
      for (let i = 0; i < downloadService.serialWaitDownloadArr.length; i++) {
        if (downloadService.serialWaitDownloadArr[i].url === downloadFirst) {
          downloadService.serialWaitDownloadArr.unshift(downloadService.serialWaitDownloadArr.splice(i, 1)[0])
          break
        }
      }
    }
    // 找到第一个等待下载的文件
    for (let i = 0; i < downloadService.serialWaitDownloadArr.length; i++) {
      if (
        downloadService.serialWaitDownloadArr[i] &&
        downloadService.serialWaitDownloadArr[i].url &&
        downloadService.serialWaitDownloadArr[i]._status === downloadService.downloadStatus.WAITING
      ) {
        downloadService.serialWaitDownloadArr.unshift(downloadService.serialWaitDownloadArr.splice(i, 1)[0])
        this.downloadWindow.webContents.downloadURL(downloadService.serialWaitDownloadArr[0].url)
        downloadService.serialWaitDownloadArr[0]._status = downloadService.downloadStatus.DOWNLOADING
        break
      }
    }
  }

  // 下载进度
  [sendDownloadProgress](receivedBytes, totalBytes, downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadProgress, {
        receivedBytes,
        totalBytes,
        downloadFile
      })
    }
  }

  // 下载暂停
  [sendDownloadPause](receivedBytes, totalBytes, downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadPause, {
        receivedBytes,
        totalBytes,
        downloadFile
      })
    }
  }

  // 下载已经中断，可以恢复
  [sendDownloadInterrupted](receivedBytes, totalBytes, downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadInterrupted, {
        receivedBytes,
        totalBytes,
        downloadFile
      })
    }
  }

  // 下载失败
  [sendDownloadFaild](state, downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadFail, {
        state,
        downloadFile
      })
    }
  }

  // 单个文件下载成功
  [sendDownloadFileSuccess](downloadFile, fileSize) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadFileSuccess, {
        downloadFile,
        fileSize
      })
    }
  }

  // 文件已经在下载或存在下载列表当中
  [fileExistDownliadList](downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.fileExistDownliadList, {
        downloadFile
      })
    }
  }

  // 添加文件到下载池（并行或者串行都算）成功
  [addDownloadFileSuccess](downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.addDownloadFileSuccess, {
        downloadFile
      })
    }
  }

  // 下载成功
  [sendDownloadSuccess](downloadFile) {
    if (this.allWindows[downloadFile.window]) {
      this.allWindows[downloadFile.window].webContents.send(appEventConfig.server.download.downloadSuccess)
    }
  }
}

const downloadService = new DownloadService()
export default downloadService
