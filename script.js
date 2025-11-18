// 1. HTML 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const impulseInput = document.getElementById('impulse-input'); // (추가됨) 체크박스
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const analyzeButton = document.getElementById('analyze-button');
const resultDiv = document.getElementById('result');

// 2. 전역 변수 선언
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let myChart = null;

// 3. 초기화
renderExpenses();

// 4. [기능] 추가하기 (수정됨)
addButton.addEventListener('click', function() {
    const date = dateInput.value;
    const category = categoryInput.value;
    const item = itemInput.value;
    const price = priceInput.value;
    const isImpulse = impulseInput.checked; // (추가됨) 체크 여부 확인 (true/false)

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
        isImpulse: isImpulse // (추가됨) 데이터에 저장
    };

    expenses.push(expense);
    saveExpenses();
    renderExpenses();

    // 입력창 초기화
    itemInput.value = '';
    priceInput.value = '';
    impulseInput.checked = false; // (추가됨) 체크박스도 해제
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 6. [기능] 화면 그리기 (수정됨)
function renderExpenses() {
    expenseList.innerHTML = '';

    expenses.forEach(function(expense) {
        const li = document.createElement('li');
        
        // (추가됨) 충동구매면 빨간색 뱃지를 달아줌
        const impulseBadge = expense.isImpulse ? '<span style="color:red; font-weight:bold; margin-right:5px;">(🤬낭비)</span>' : '';
        
        // (추가됨) 충동구매면 배경색을 살짝 붉게 처리
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
    updateChart();
}

window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

// 8. 차트 그리기 (그대로)
function updateChart() {
    const categoryTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };
    expenses.forEach(expense => {
        if (categoryTotals[expense.category] !== undefined) {
            categoryTotals[expense.category] += expense.price;
        } else {
            categoryTotals["기타"] += expense.price;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (myChart) myChart.destroy();

    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: '지출 금액',
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// 9. [기능] AI 분석 요청 (수정됨)
analyzeButton.addEventListener("click", async function() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }

    resultDiv.innerHTML = "AI가 소비 내역을 분석 중입니다... 🤖";
    analyzeButton.disabled = true;

    // (수정됨) AI에게 보낼 때 충동구매 여부를 명확히 표시해서 보냄!
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