let allQuestions = [];
let userAnswers = [];
let score = 0;
let currentIndex = 0;
const sections = ['vocab', 'grammar', 'reading'];

async function startTest(level, deSo) {
    allQuestions = [];
    // Load lần lượt từng file JSON
    for (let sec of sections) {
        try {
            const response = await fetch(`./exams/${level.toLowerCase()}_de${deSo}_${sec}.json`);
            const data = await response.json();
            allQuestions = allQuestions.concat(data);
        } catch (e) {
            console.error("Lỗi khi load phần " + sec, e);
        }
    }

    if (allQuestions.length === 0) {
        alert("Chưa có dữ liệu bài thi!");
        return;
    }

    userAnswers = new Array(allQuestions.length);
    currentIndex = 0;
    
    document.getElementById('menu-chon-level').style.display = 'none';
    document.getElementById('man-hinh-test').style.display = 'flex';
    
    renderQuestion();
}

function renderQuestion() {
    if (currentIndex >= allQuestions.length) {
        submitTest();
        return;
    }
    const q = allQuestions[currentIndex];
    // Hiển thị câu hỏi kèm số thứ tự
    document.getElementById('cau-hoi-box').innerHTML = `Câu ${currentIndex + 1}/${allQuestions.length}: ${q.question}`;
    
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
    allQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) score++;
    });
    
    // Hiện kết quả tổng
    document.getElementById('man-hinh-test').innerHTML = `
        <h2>Kết quả chung cuộc: ${score}/${allQuestions.length}</h2>
        <button class="btn-level" onclick="location.reload()">LÀM LẠI TỪ ĐẦU</button>
    `;
}
