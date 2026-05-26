const { ipcRenderer } = require('electron');

window.addEventListener('mousedown', (e) => {
  // Nếu bấm trúng nút bấm (button) hoặc input thì không kéo app
  if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'].includes(e.target.tagName)) {
    return;
  }
  // Nhấn chuột xuống -> Báo hệ thống bắt đầu kéo
  ipcRenderer.send('start-drag');
});

window.addEventListener('mouseup', () => {
  // Buông chuột ra -> Báo hệ thống dừng kéo ngay lập tức
  ipcRenderer.send('stop-drag');
});

window.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy dữ liệu ngày tháng hiện tại
    const staticDate = new Date();
    const dateString = staticDate.getDate(); // Ví dụ: 26
    const monthString = "Tháng " + (staticDate.getMonth() + 1); // Ví dụ: Tháng 5

    // 2. Tìm thẻ HTML theo ID và đổ dữ liệu vào
    const dateElement = document.getElementById('current-date');
    const monthElement = document.getElementById('current-month');

    if (dateElement) {
        dateElement.innerText = dateString;
    }
    if (monthElement) {
        monthElement.innerText = monthString;
    }
});