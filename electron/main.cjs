// PC 앱(Electron)의 시작점. 빌드된 웹 화면(dist)을 창에 띄운다.

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, net, protocol, shell } = require('electron');

// 파일을 직접 열면(file://) ES 모듈이 막히므로, 앱 전용 주소(app://)로 화면 파일을 내보낸다.
const SCHEME = 'app';
const ENTRY = `${SCHEME}://local/index.html`;

// 개발 중에는 ../dist, 설치된 앱에서는 앱 안에 복사된 web 폴더를 쓴다.
const webRoot = app.isPackaged
  ? path.join(__dirname, 'web')
  : path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/** app://local/경로 를 web 폴더 안의 파일로 바꾼다. 폴더 밖으로 나가는 경로는 막는다. */
const serveFile = (request) => {
  const { pathname } = new URL(request.url);
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.normalize(path.join(webRoot, relative));
  if (!file.startsWith(webRoot)) return new Response('Not found', { status: 404 });
  return net.fetch(pathToFileURL(file).toString());
};

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 360,
    minHeight: 600,
    title: '아카펠라 박자 계산기',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 외부 링크는 앱 안이 아니라 기본 브라우저로 연다.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://`)) event.preventDefault();
  });

  win.loadURL(ENTRY);
};

app.whenReady().then(() => {
  protocol.handle(SCHEME, serveFile);
  createWindow();

  // Mac에서는 창을 모두 닫아도 앱이 남아 있으므로, 독 아이콘을 누르면 창을 다시 연다.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
