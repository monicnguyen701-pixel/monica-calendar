const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 214,
    height: 228,
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
