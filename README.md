# electron-app-service-downloaded    

> 为Electron应用提供下载服务的npm包    


# 下载    

```
$ npm install electron-app-service-downloaded
```


# 使用

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
 * downloadFiles: [{
 *     url: 'https://test-cdn.vipthink.cn/video/class/course_share_201910301510.zip', 下载资源路径
 *     downloadFolder: 'C:\\Users\\caozhenhui\\Desktop', 保存到哪里
 *     downloadFileName: 'abc.zip', 保存下来的文件名称（可选）
 *     downloadMode: 'serial', serial（串行下载）、parallel（并行下载）
 *     window: 'indexWindow' 回调给哪个渲染进程，对应init方法needDownloadServiceWindow参数的key
 * }]
 */
download(downloadFiles)
```
