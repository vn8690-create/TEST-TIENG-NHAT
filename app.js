// Biến lưu trữ bài thi hiện tại
let currentTest = [];
let userAnswers = [];
let score = 0;
let currentIndex = 0;

// Hàm bắt đầu thi: Load file JSON tương ứng
async function startTest(level, deSo) {
    try {
        // Load file từ thư mục exams/
        const response = await fetch(`./exams/${level.toLowerCase()}_de${deSo}.json`);
        currentTest = await response.json();
        
        // Reset trạng thái
        userAnswers = [];
        score = 0;
        currentIndex = 0;
        
        // Chuyển màn hình
        document.getElementById('menu-chon-level').style.display = 'none';
        document.getElementById('man-hinh-test').style.display = 'flex';
        
        renderQuestion();
    } catch (err) {
        alert("Chưa có dữ liệu đề này bro ơi!");
    }
}

function renderQuestion() {
    if (currentIndex >= currentTest.length) {
        submitTest();
        return;
    }
    const q = currentTest[currentIndex];
    document.getElementById('cau-hoi-box').innerText = q.question;
    const optionsBox = document.getElementById('options-box');
    optionsBox.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'btn-level';
        btn.onclick = () => {
            userAnswers[currentIndex] = index;
            currentIndex++;
            renderQuestion();
        };
        optionsBox.appendChild(btn);
    });
}

function submitTest() {
    score = 0;
    currentTest.forEach((q, index) => {
        if (userAnswers[index] === q.correct) score++;
    });
    
    document.getElementById('man-hinh-test').innerHTML = `
        <h2>Kết quả: ${score}/${currentTest.length}</h2>
        <button class="btn-level" onclick="location.reload()">VỀ TRANG CHỦ</button>
    `;
}
