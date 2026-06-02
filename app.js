// Dữ liệu mẫu (sau này bro có thể thay bằng file JSON lớn hơn)
const database = {
    'N5': [
        { q: "Chữ này đọc là gì: 日本?", a: ["Nihon", "Nihon", "Nippon", "Nichi"], correct: 0 },
        { q: "Số 5 tiếng Nhật là gì?", a: ["San", "Go", "Roku", "Nana"], correct: 1 }
    ],
    'N4': [
        { q: "Tiếng Nhật của 'Công ty' là?", a: ["Gakkou", "Kaisha", "Byouin", "Eki"], correct: 1 }
    ]
};

let currentTest = [];
let score = 0;
let currentIndex = 0;
let timeLeft = 1800; // 30 phút

function startTest(level) {
    currentTest = database[level];
    score = 0;
    currentIndex = 0;
    document.getElementById('menu-chon-level').classList.remove('active');
    document.getElementById('man-hinh-test').classList.add('active');
    
    batDauTimer();
    renderQuestion();
}

function renderQuestion() {
    if (currentIndex >= currentTest.length) {
        ketThucTest();
        return;
    }
    const q = currentTest[currentIndex];
    document.getElementById('cau-hoi-box').innerText = q.q;
    const optionsBox = document.getElementById('options-box');
    optionsBox.innerHTML = '';
    
    q.a.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'btn-level';
        btn.onclick = () => checkAnswer(index);
        optionsBox.appendChild(btn);
    });
}

function checkAnswer(index) {
    if (index === currentTest[currentIndex].correct) score++;
    currentIndex++;
    renderQuestion();
}

function batDauTimer() {
    const timerDisplay = document.getElementById('timer');
    const interval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            ketThucTest();
        }
    }, 1000);
}

function ketThucTest() {
    document.getElementById('man-hinh-test').innerHTML = `<h2>Kết quả: ${score}/${currentTest.length}</h2>
    <button class="btn-level" onclick="location.reload()">LÀM LẠI</button>`;
}
