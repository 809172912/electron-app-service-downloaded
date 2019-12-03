# electron-app-service-downloaded    

> 为Electron应用提供下载服务的npm包    


# 下载    

```
$ npm install electron-app-service-downloaded
```


# 使用 api

> ***初始化***

```
import electronAppServiceDownload from "electron-app-service-downloaded"

// 需要用到下载服务的渲染进程
let needDownloadServiceWindow = {
    loginWindow: new BrowserWindow({……}),
    indexWindow: new BrowserWindow({……})
}
// 执行下载功能的渲染进程
let goDownloadWindow = needDownloadServiceWindow.indexWindow
electronDownloadService.init(needDownloadServiceWindow, goDownloadWindow)
```

> ***添加需要用到下载服务的渲染进程***

```
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
