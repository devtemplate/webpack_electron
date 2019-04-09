import { app, BrowserWindow, protocol, InterceptBufferProtocolRequest } from 'electron';
import { join } from 'path';
import { parse } from 'url';
import { readFile } from 'fs';
import precachelist from './define';

console.log('precachelist', precachelist);

function resolveCache(pathname) {
  // 基于 build 目录计算
  return join(__dirname, '..', pathname);
}

const memCache = {};

// 通过 webRequest 拦截网络请求，从而实现离线在线的转换控制呢?
function withCache(request: InterceptBufferProtocolRequest, callback: (steam: Buffer) => void): void {
  const pathname = parse(request.url).pathname;

  const isMatch = precachelist.some(item => {
    return item === pathname;
  });
  const isAssets = pathname.startsWith('/static');
  if (isMatch) {
    let fullpath = resolveCache(join(isAssets ? 'assets/' : 'build/', pathname.replace('/static', '')));
    console.log('fullpath', fullpath);
    readFile(
      fullpath,
      {
        flag: 'r',
        encoding: 'utf-8'
      },
      (error, data) => {
        if (error) {
          // TODO: should show 404?
          console.log('error', error);
        }

        callback(Buffer.from(data));
      }
    );
  }
}

function createWindow() {
  protocol.interceptBufferProtocol('http', withCache);
  protocol.interceptBufferProtocol('https', withCache);
  // session.defaultSession.webRequest.onBeforeRequest(withCache);

  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false
    }
  });
  // 分别构建 html 交给 renderer 构建，所以在目录层次上不能通过 require 接过来
  // 不过目录规律一定，可以通过约定的方式解决文件引入的问题
  // win.loadFile(resolvePageHtml('pages/app'));
  win.loadURL('http://www.baidu.com/pages/app.html');
}

app.on('ready', createWindow);
