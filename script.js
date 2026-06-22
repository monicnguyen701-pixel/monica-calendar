const { ipcRenderer } = require('electron');
const motivationalMessages = require('./messages.js');

// Lấy chuỗi định dạng ngày hôm nay (YYYY-MM-DD) theo giờ địa phương
function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

// Lấy thông điệp ngẫu nhiên không trùng lặp sử dụng localStorage
function getRandomMessage() {
    let seenMessages = [];
    try {
        const storedSeen = localStorage.getItem('seenMessages');
        if (storedSeen) {
            seenMessages = JSON.parse(storedSeen);
        }
    } catch (e) {
        console.error('Lỗi khi đọc seenMessages từ localStorage:', e);
    }

    // Nếu đã xem hết tất cả thông điệp (hoặc do file bị thay đổi số lượng), reset danh sách
    if (seenMessages.length >= motivationalMessages.length) {
        seenMessages = [];
    }

    // Lọc danh sách các index chưa xem
    const availableIndices = [];
    for (let i = 0; i < motivationalMessages.length; i++) {
        if (!seenMessages.includes(i)) {
            availableIndices.push(i);
        }
    }

    // Fallback nếu không có index nào (ví dụ mảng rỗng)
    if (availableIndices.length === 0) {
        seenMessages = [];
        for (let i = 0; i < motivationalMessages.length; i++) {
            availableIndices.push(i);
        }
    }

    // Chọn ngẫu nhiên một index chưa xem
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // Lưu index đã xem vào localStorage
    seenMessages.push(randomIndex);
    localStorage.setItem('seenMessages', JSON.stringify(seenMessages));

    return motivationalMessages[randomIndex];
}

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
    const dateString = staticDate.getDate(); // Ví dụ: 30
    
    const weekdaysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const weekdayString = weekdaysVi[staticDate.getDay()]; // Ví dụ: Thứ Bảy
    
    const month = staticDate.getMonth() + 1;
    const year = staticDate.getFullYear();
    const monthYearString = `THÁNG ${month} ${year}`; // Ví dụ: THÁNG 5 2026

    // 2. Tìm thẻ HTML và đổ dữ liệu vào
    const dateElement = document.getElementById('current-date');
    const weekdayElement = document.getElementById('calendar-weekday');
    const topElement = document.getElementById('calendar-top');
    const imageElement = document.getElementById('calendar-image');

    if (dateElement) {
        dateElement.innerText = dateString;
    }
    if (weekdayElement) {
        weekdayElement.innerText = weekdayString;
    }
    if (topElement) {
        topElement.innerText = monthYearString;
    }

    // 2.3. Tải ngẫu nhiên hình minh họa từ thư mục img (quét động toàn bộ ảnh bắt đầu bằng chữ h)
    if (imageElement) {
        try {
            const fs = require('fs');
            const path = require('path');
            const imgDir = path.join(__dirname, 'img');
            const files = fs.readdirSync(imgDir);
            
            // Lọc các file bắt đầu bằng chữ 'h' và có đuôi định dạng ảnh
            const imgFiles = files.filter(f => /^h.*\.(png|jpe?g|webp)$/i.test(f));
            
            if (imgFiles.length > 0) {
                const randomFile = imgFiles[Math.floor(Math.random() * imgFiles.length)];
                imageElement.src = `img/${randomFile}`;
                console.log('Selected random image:', randomFile);
            } else {
                imageElement.src = 'img/h1 (1).png';
            }
        } catch (err) {
            console.error('Lỗi quét thư mục ảnh:', err);
            imageElement.src = 'img/h1 (1).png';
        }
    }

    // 2.5. Xử lý nút đóng Widget
    const closeWidgetBtn = document.getElementById('close-widget-btn');
    if (closeWidgetBtn) {
        closeWidgetBtn.addEventListener('click', () => {
            ipcRenderer.send('close-window');
            window.close();
        });
    }

    // 3. Khởi tạo tính năng hiển thị thông điệp hàng ngày
    const clickMeBtn = document.getElementById('click-me-btn');
    const messageModal = document.getElementById('message-modal');
    const modalText = document.getElementById('modal-text');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (clickMeBtn && messageModal && modalText && closeModalBtn) {
        // Hàm đóng modal
        const closeModal = () => {
            messageModal.classList.remove('active');
        };

        // Hàm mở modal với nội dung
        const openModal = (text) => {
            modalText.innerText = text;
            messageModal.classList.add('active');
        };

        // Lắng nghe sự kiện click của nút Click Me
        clickMeBtn.addEventListener('click', () => {
            const today = getTodayString();
            const lastClicked = localStorage.getItem('lastClickedDate');

            if (lastClicked === today) {
                // Nhấn từ lần thứ hai trong ngày -> hiển thị lại thông điệp đã nhận đầu ngày
                const savedMessage = localStorage.getItem('todayMessage');
                if (savedMessage) {
                    openModal(savedMessage);
                } else {
                    // Phòng trường hợp hôm nay đã click nhưng dữ liệu tin nhắn bị lỗi/trống
                    const message = getRandomMessage();
                    localStorage.setItem('todayMessage', message);
                    openModal(message);
                }
            } else {
                // Lần đầu tiên trong ngày -> lấy thông điệp ngẫu nhiên mới và lưu lại
                const message = getRandomMessage();
                localStorage.setItem('lastClickedDate', today);
                localStorage.setItem('todayMessage', message);
                openModal(message);
            }
        });

        // Lắng nghe sự kiện click nút đóng
        closeModalBtn.addEventListener('click', closeModal);

        // Click ra ngoài modal (trên overlay) cũng đóng modal
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) {
                closeModal();
            }
        });
    }
});