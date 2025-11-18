// 1. HTML 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const impulseInput = document.getElementById('impulse-input'); 
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const analyzeButton = document.getElementById('analyze-button');
const resultDiv = document.getElementById('result');

// 2. 전역 변수 선언
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
// 차트 변수 2개 준비
let monthlyChart = null; 
let todayChart = null;

// 3. 초기화
renderExpenses();

// 4. [기능] 추가하기
addButton.addEventListener('click', function() {
    const date = dateInput.value;
    const category = categoryInput.value;
    const item = itemInput.value;
    const price = priceInput.value;
    const isImpulse = impulseInput.checked; 

    if(date === '' || item === '' || price === '') {
        alert('모든 내용을 입력해주세요!');
        return;
    }

    const expense = {
        id: Date.now(),
        date: date,
        category: category,
        item: item,
        price: Number(price),
        isImpulse: isImpulse 
    };

    expenses.push(expense);
    saveExpenses();
    renderExpenses();

    itemInput.value = '';
    priceInput.value = '';
    impulseInput.checked = false; 
});

// 5. 저장 함수
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 6. 화면 그리기
function renderExpenses() {
    expenseList.innerHTML = '';

    // 리스트 최신순 정렬 (날짜 내림차순)
    const sortedExpenses = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(function(expense) {
        const li = document.createElement('li');
        
        const impulseBadge = expense.isImpulse ? '<span style="color:red; font-weight:bold; margin-right:5px;">(🤬낭비)</span>' : '';
        
        if (expense.isImpulse) {
            li.style.backgroundColor = "#FFF0F0";
        }

        li.innerHTML = `
            <span>
                ${impulseBadge}
                [${expense.category}] <strong>${expense.item}</strong>
                <span style="font-size:12px; color:#888;">(${expense.date})</span>
            </span>
            <span>
                ${expense.price.toLocaleString()}원 
                <button onclick="deleteExpense(${expense.id})">X</button>
            </span>
        `;
        expenseList.appendChild(li);
    });
    
    // 차트 2개 모두 업데이트
    updateChart();
}

// 7. 삭제하기
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

// 8. 📊 차트 그리기 (대수술!)
function updateChart() {
    // --- [준비] 데이터 분류 ---
    const todayDate = new Date().toISOString().split('T')[0]; // 오늘 날짜 (YYYY-MM-DD)

    const monthTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };
    const todayTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };

    expenses.forEach(expense => {
        // 1. 전체(월간) 합계
        if (monthTotals[expense.category] !== undefined) {
            monthTotals[expense.category] += expense.price;
        } else {
            monthTotals["기타"] += expense.price;
        }

        // 2. 오늘 합계 (날짜가 오늘과 같으면)
        if (expense.date === todayDate) {
             if (todayTotals[expense.category] !== undefined) {
                todayTotals[expense.category] += expense.price;
            } else {
                todayTotals["기타"] += expense.price;
            }
        }
    });

    // --- [차트 1] 이번 달 (도넛 차트) ---
    const monthCtx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(monthCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(monthTotals),
            datasets: [{
                data: Object.values(monthTotals),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } } // 공간 좁아서 범례 숨김
        }
    });

    // --- [차트 2] 오늘 (막대 차트) ---
    const todayCtx = document.getElementById('todayChart').getContext('2d');
    if (todayChart) todayChart.destroy();

    todayChart = new Chart(todayCtx, {
        type: 'bar', // 막대 그래프!
        data: {
            labels: Object.keys(todayTotals),
            datasets: [{
                label: '오늘 지출',
                data: Object.values(todayTotals),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true } // 0부터 시작
            }
        }
    });
}

// 9. AI 분석 요청
analyzeButton.addEventListener("click", async function() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }
    resultDiv.innerHTML = "AI가 소비 내역을 분석 중입니다... 🤖";
    analyzeButton.disabled = true;

    let diaryText = "최근 소비 내역입니다:\n";
    expenses.forEach(e => {
        const marker = e.isImpulse ? "[!!!사용자가 인정한 낭비!!!]" : "[일반 소비]";
        diaryText += `- ${e.date} ${marker} [${e.category}] ${e.item}: ${e.price}원\n`;
    });

    try {
        const response = await fetch(
            `/.netlify/functions/analyze`, 
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ diary: diaryText }), 
            }
        );
        const data = await response.json();
        if (response.status !== 200) throw new Error(data.error);
        resultDiv.textContent = data.result;
    } catch (error) {
        console.error("오류:", error);
        resultDiv.textContent = `오류: ${error.message}`;
    } finally {
        analyzeButton.disabled = false;
    }
});