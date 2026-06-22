const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;

// Lắng nghe sự kiện đóng ứng dụng từ renderer process
ipcMain.on('close-window', () => {
  app.quit();
});

function createWindow() {
  const iconPath = path.join(__dirname, process.platform === 'win32' ? 'icon_v3.ico' : 'icon_v3.png');

  const win = new BrowserWindow({
    width: 220,
    height: 320,
    icon: iconPath,
    frame: false,         // Ẩn thanh công cụ và viền mặc định của Windows
    transparent: true,     // Bật chế độ trong suốt để bo góc CSS có hiệu lực
    resizable: false,     // Cố định kích thước, không cho kéo dãn app
    webPreferences: {
      nodeIntegration: true,      // Cho phép dùng Node.js trong script
      contextIsolation: false,    // Tắt cô lập ngữ cảnh để file script tương tác được với HTML
      sandbox: false              // Tắt sandbox để script chạy mượt mà không bị chặn
    }
  });

  // Ẩn hoàn toàn thanh menu (File, Edit, View...)
  win.setMenu(null);

  win.loadFile('index.html');
  // win.webContents.openDevTools({ mode: 'detach' });

  // Khởi tạo Tray icon
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Hiện ứng dụng', click: () => { win.show(); } },
    { label: 'Thoát', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('Monica Calendar');
  tray.setContextMenu(contextMenu);

  // Click vào Tray để ẩn/hiện window
  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
