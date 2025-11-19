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

// 2. 전역 변수
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let monthlyChart = null; 
let todayChart = null;

// 3. 초기 실행
renderExpenses();

// 4. 추가하기
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
    const sortedExpenses = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(function(expense) {
        const li = document.createElement('li');
        
        if (expense.isImpulse) {
            li.classList.add('impulse');
        }

        const impulseBadge = expense.isImpulse ? '<span style="color:#FF6B6B; font-weight:bold; margin-right:5px;">(🤬낭비)</span>' : '';

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
}

// 7. 삭제하기
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

// 8. 차트 그리기 (수정됨: 퍼센트 표시 로직 추가)
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

    // (수정됨) 차트 공통 옵션: 범례 표시 & 툴팁에 퍼센트 계산
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            // 1. 범례(항목 이름) 표시
            legend: { 
                display: true, 
                position: 'top',
                labels: { font: { size: 12 }, boxWidth: 10 }
            },
            // 2. 툴팁에 금액과 퍼센트(%) 표시
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        let value = context.raw || 0;
                        
                        // 전체 합계 계산
                        let total = context.dataset.data.reduce((a, b) => a + b, 0);
                        // 퍼센트 계산
                        let percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                        return `${label}: ${value.toLocaleString()}원 (${percentage}%)`;
                    }
                }
            }
        }
    };

    // 월간 도넛 차트
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
        options: commonOptions // 위에서 만든 옵션 적용
    });

    // 오늘 막대 차트
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
        options: {
            ...commonOptions, // 공통 옵션 상속
            scales: { y: { beginAtZero: true } }
        }
    });
}

// 9. AI 분석 요청
analyzeButton.addEventListener("click", async function() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }
    resultDiv.innerHTML = "AI가 데이터를 분석하고 있습니다... ⏳";
    analyzeButton.disabled = true;

    let diaryText = "최근 소비 내역입니다:\n";
    expenses.forEach(e => {
        const marker = e.isImpulse ? "[사용자가 인정한 낭비]" : "";
        diaryText += `- ${e.date} ${marker} [${e.category}] ${e.item}: ${e.price}원\n`;
    });

    try {
        const response = await fetch('/.netlify/functions/analyze', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ diary: diaryText }), 
        });
        const data = await response.json();
        if (response.status !== 200) throw new Error(data.error);
        resultDiv.textContent = data.result;
    } catch (error) {
        console.error("오류:", error);
        resultDiv.textContent = `오류 발생: ${error.message}`;
    } finally {
        analyzeButton.disabled = false;
    }
});