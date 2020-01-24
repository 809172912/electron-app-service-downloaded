# electron-app-service-downloaded    

> 为Electron应用提供下载服务的npm包    


# 下载    

```
$ npm install electron-app-service-downloaded
```


# 使用 api

> ***初始化***

```
// 主进程index.js

import electronAppServiceDownload from "electron-app-service-downloaded"

// 需要用到下载服务的渲染进程
let needDownloadServiceWindow = {
    loginWindow: new BrowserWindow({……}),
    indexWindow: new BrowserWindow({……})
}
// 执行下载功能的渲染进程
let goDownloadWindow = needDownloadServiceWindow.indexWindow
// 初始化
electronDownloadService.init(goDownloadWindow)
electronDownloadService.addWindows(needDownloadServiceWindow)
```

> ***添加需要用到下载服务的渲染进程***

```
// 主进程index.js

/**
 * appWindows: {
 *      loginWindow: new BrowserWindow({……})
 * }
 */
addWindows(appWindows)
```

> ***下载文件***

```
/**
 * downloadFileList: [{
 *     url: 'https://***.cn/***.zip', 下载资源路径
 *     downloadFolder: 'C:\\Users\\***\\Desktop', 保存到哪里
 *     downloadFileName: 'abc.zip', 保存下来的文件名称（可选）
 *     downloadMode: 'serial', serial（串行下载）、parallel（并行下载）
 *     _status: 'pause', （可选）要是有这个字段且值为'pause'，同时downloadMode = 'serial', 那么就默认为暂停状态，需要手动调用恢复下载，才能执行下载
 *     window: 'indexWindow' 下载状态、进度回调给哪个渲染进程，对应init方法needDownloadServiceWindow参数的key
 * }]
 */
download(downloadFileList)
```

> ***暂停下载***

```
/**
 * pauseFileList: [
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 * ]
 */
pause(pauseFileList)
```

> ***暂停全部下载***

```
pauseAll()
```

> ***暂停恢复***

```
/**
 * resumeFileList: [
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 * ]
 */
resume(resumeFileList)
```

> ***取消下载***

```
/**
 * cancelFileList: [
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 *     'https://***.cn/***.zip' 下载资源路径
 * ]
 */
cancel(cancelFileList)
```

> ***取消全部下载***

```
cancelAll()
```

> ***当前正在下载的文件***

```
/**
 * @returns {Array} 
 */
getCurrentDownloading()
```

> ***是否有文件正在下载***

```
/**
 * @returns {Boolean} 
 */
isDownloading()
```

> ***是否有串行下载文件正在下载***

```
/**
 * @returns {Boolean} 
 */
isSerialDownloading()
```

> ***获取未完成下载的串行下载文件***

```
/**
 * @returns {Array} 
 */
getWaitDownloadFiles()
```

# 监听事件

## ***下载进度***

> server-download-downloadProgress

```
/**
 * receivedBytes: 已下载的大小（字节）
 * totalBytes: 文件总大小（字节）
 * downloadFile: 当前暂停的文件
 */
callback({receivedBytes, totalBytes, downloadFile})
```

## ***下载暂停***

> server-download-downloadPause

```
/**
 * receivedBytes: 已下载的大小（字节）
 * totalBytes: 文件总大小（字节）
 * downloadFile: 当前暂停的文件
 */
callback({receivedBytes, totalBytes, downloadFile})
```

## ***下载已经中断，可以恢复***

> server-download-downloadPause

```
/**
 * receivedBytes: 已下载的大小（字节）
 * totalBytes: 文件总大小（字节）
 * downloadFile: 当前暂停的文件
 */
callback({receivedBytes, totalBytes, downloadFile})
```

## ***下载失败***

> server-download-downloadFail

```
/**
 * state: cancelled（下载已被取消）、interrupted（下载已经中断，无法恢复）
 * downloadFile: 当前暂停的文件
 */
callback({state, downloadFile})
```

## ***单个文件下载成功***

> server-download-downloadFileSuccess

```
/**
 * downloadFile: 当前暂停的文件
 */
callback({downloadFile})
```

## ***文件已经在下载队列当中***

> server-download-fileExistDownliadList

```
/**
 * downloadFile: 当前添加到下载队列的文件
 */
callback({downloadFile})
```

## ***添加文件到下载池（并行或者串行都算）成功***

> server-download-addDownloadFileSuccess

```
/**
 * downloadFile: 当前添加到下载队列的文件
 */
callback({downloadFile})
```
