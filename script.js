// 1. HTML 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const impulseInput = document.getElementById('impulse-input');
const emotionInput = document.getElementById('emotion-input'); // (NEW) 감정 입력창
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const resultDiv = document.getElementById('result');

// 통계 요소
const totalAmountEl = document.getElementById('total-amount');
const wasteAmountEl = document.getElementById('waste-amount');
const wasteRateEl = document.getElementById('waste-rate');
const goalStatusEl = document.getElementById('goal-status');
const goalInput = document.getElementById('goal-input');

const btnPC = document.getElementById('analyze-button-pc');
const btnMobile = document.getElementById('analyze-button-mobile');

// 2. 전역 변수
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let monthlyChart = null;
let todayChart = null;

// 목표값 불러오기
let userGoal = localStorage.getItem('userGoal') || 20;
goalInput.value = userGoal;

// 3. 초기 실행
renderExpenses();

// (NEW) 낭비 체크박스 변경 시 감정 입력창 표시/숨김
impulseInput.addEventListener('change', function() {
    if (this.checked) {
        emotionInput.style.display = 'block';
        emotionInput.focus();
    } else {
        emotionInput.style.display = 'none';
        emotionInput.value = ''; // 체크 해제하면 내용 지우기
    }
});

// 목표 값 변경 저장
goalInput.addEventListener('input', function() {
    userGoal = goalInput.value;
    localStorage.setItem('userGoal', userGoal);
    updateSummary();
});

// 4. 추가하기
addButton.addEventListener('click', function() {
    const date = dateInput.value;
    const category = categoryInput.value;
    const item = itemInput.value;
    const price = priceInput.value;
    const isImpulse = impulseInput.checked;
    const emotion = isImpulse ? emotionInput.value : ''; // (NEW) 낭비일 때만 감정 저장

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
        isImpulse: isImpulse,
        emotion: emotion // (NEW) 데이터에 감정 포함
    };

    expenses.push(expense);
    saveExpenses();
    renderExpenses();

    // 초기화
    itemInput.value = '';
    priceInput.value = '';
    impulseInput.checked = false;
    emotionInput.value = '';
    emotionInput.style.display = 'none'; // (NEW) 입력창 다시 숨기기
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function renderExpenses() {
    expenseList.innerHTML = '';
    const sortedExpenses = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(function(expense) {
        const li = document.createElement('li');
        if (expense.isImpulse) li.classList.add('impulse');
        
        // (NEW) 낭비일 경우 감정/이유도 툴팁이나 텍스트로 표시
        let impulseBadge = '';
        if (expense.isImpulse) {
            const reason = expense.emotion ? `(${expense.emotion})` : '';
            impulseBadge = `<span style="color:#FF6B6B; font-weight:bold; margin-right:5px;">(낭비${reason})</span>`;
        }

        li.innerHTML = `
            <span>
                ${impulseBadge}
                <span style="color:#666">[${expense.category}]</span> 
                <strong>${expense.item}</strong>
                <span style="font-size:12px; color:#999; margin-left:5px;">(${expense.date})</span>
            </span>
            <span style="display:flex; align-items:center;">
                <strong>${expense.price.toLocaleString()}원</strong>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})"><i class="fas fa-times"></i></button>
            </span>
        `;
        expenseList.appendChild(li);
    });
    
    updateChart();
    updateSummary(); 
}

window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

function updateSummary() {
    const total = expenses.reduce((sum, item) => sum + item.price, 0);
    const waste = expenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);

    totalAmountEl.textContent = total.toLocaleString() + "원";
    wasteAmountEl.textContent = waste.toLocaleString() + "원";
    wasteRateEl.textContent = rate + "%";

    if (total === 0) {
        goalStatusEl.textContent = "-";
        goalStatusEl.style.color = "#888";
    } else if (rate < userGoal) {
        goalStatusEl.textContent = "목표 달성 중!";
        goalStatusEl.style.color = "#4BC0C0"; 
    } else {
        goalStatusEl.textContent = "관리 필요!";
        goalStatusEl.style.color = "#FF6B6B"; 
    }
}

function updateChart() {
    const todayDate = new Date().toISOString().split('T')[0];
    const monthTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };
    const todayTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };

    expenses.forEach(expense => {
        if (monthTotals[expense.category] !== undefined) monthTotals[expense.category] += expense.price;
        else monthTotals["기타"] += expense.price;

        if (expense.date === todayDate) {
             if (todayTotals[expense.category] !== undefined) todayTotals[expense.category] += expense.price;
            else todayTotals["기타"] += expense.price;
        }
    });

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { font: { size: 12 }, boxWidth: 10 } },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        let value = context.raw || 0;
                        let total = context.dataset.data.reduce((a, b) => a + b, 0);
                        let percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value.toLocaleString()}원 (${percentage}%)`;
                    }
                }
            }
        }
    };

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
        options: commonOptions
    });

    const todayCtx = document.getElementById('todayChart').getContext('2d');
    if (todayChart) todayChart.destroy();
    todayChart = new Chart(todayCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(todayTotals),
            datasets: [{
                label: '오늘 지출',
                data: Object.values(todayTotals),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderRadius: 5
            }]
        },
        options: { ...commonOptions, scales: { y: { beginAtZero: true } } }
    });
}

// 9. AI 분석 요청 함수
async function runAnalysis() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }
    
    resultDiv.innerHTML = "상담사가 데이터를 분석하고 있습니다... ⏳";
    
    if(btnPC) btnPC.disabled = true;
    if(btnMobile) btnMobile.disabled = true;

    const total = expenses.reduce((sum, item) => sum + item.price, 0);
    const waste = expenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);
    
    const goalStatus = rate < userGoal ? `목표(${userGoal}%) 달성 성공` : `목표(${userGoal}%) 초과 실패`;

    const sortedForAI = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentItems = sortedForAI.slice(0, 15);

    let diaryText = `
    [현재 소비 통계]
    - 총 지출: ${total}원
    - 낭비 금액: ${waste}원
    - 낭비율: ${rate}%
    - 사용자 목표: 낭비율 ${userGoal}% 미만
    - 상태: ${goalStatus}

    [최근 소비 내역 (최신순)]
    `;

    recentItems.forEach(e => {
        // (NEW) 낭비 항목일 경우 사용자가 적은 이유(emotion)를 함께 전송
        let marker = "";
        if (e.isImpulse) {
            marker = `[낭비: ${e.emotion || '이유 없음'}]`;
        }
        diaryText += `- ${e.date} ${marker} [${e.category}] ${e.item}: ${e.price}원\n`;
    });

    try {
        const response = await fetch('/.netlify/functions/analyze', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ diary: diaryText }), 
        });

        if (!response.ok) {
            if (response.status === 503 || response.status === 504) {
                throw new Error("분석 시간이 초과되었습니다.");
            }
            throw new Error(`서버 오류 (${response.status})`);
        }

        const data = await response.json();
        resultDiv.textContent = data.result;

    } catch (error) {
        console.error("오류:", error);
        resultDiv.innerHTML = `<span style="color:red;">오류 발생: ${error.message}</span>`;
    } finally {
        if(btnPC) btnPC.disabled = false;
        if(btnMobile) btnMobile.disabled = false;
    }
}

if(btnPC) btnPC.addEventListener("click", runAnalysis);
if(btnMobile) btnMobile.addEventListener("click", runAnalysis);