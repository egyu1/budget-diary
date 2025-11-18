// 1. HTML 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const analyzeButton = document.getElementById('analyze-button');
const resultDiv = document.getElementById('result');

// 2. 전역 변수 선언 (여기로 옮겼습니다! 중요 ⭐)
// 브라우저에 저장된 'expenses'가 있으면 가져오고, 없으면 빈 배열 [] 로 시작
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let myChart = null; // 차트 변수도 여기서 미리 선언

// 3. 화면이 켜지면 일단 저장된 목록과 차트부터 그려줌
renderExpenses();

// 4. [기능] 소비 내역 추가하기
addButton.addEventListener('click', function() {
    const date = dateInput.value;
    const category = categoryInput.value;
    const item = itemInput.value;
    const price = priceInput.value;

    if(date === '' || item === '' || price === '') {
        alert('모든 내용을 입력해주세요!');
        return;
    }

    // 데이터 객체 만들기
    const expense = {
        id: Date.now(), // 고유 ID (삭제할 때 씀)
        date: date,
        category: category,
        item: item,
        price: Number(price)
    };

    // 배열에 추가하고 저장
    expenses.push(expense);
    saveExpenses();
    renderExpenses(); // 화면 갱신

    // 입력창 초기화
    itemInput.value = '';
    priceInput.value = '';
});

// 5. [기능] 데이터 저장 함수
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 6. [기능] 화면 그리기 함수 (리스트 + 차트)
function renderExpenses() {
    expenseList.innerHTML = ''; // 목록 싹 비우고 다시 그림

    expenses.forEach(function(expense) {
        const li = document.createElement('li');
        
        // 디자인 CSS에 맞춰서 버튼 스타일 적용
        li.innerHTML = `
            <span>[${expense.category}] <strong>${expense.item}</strong> (${expense.date})</span>
            <span>
                ${expense.price.toLocaleString()}원 
                <button onclick="deleteExpense(${expense.id})">X</button>
            </span>
        `;
        expenseList.appendChild(li);
    });

    // 리스트 그릴 때 차트도 같이 업데이트 (이제 에러 안 날 겁니다!)
    updateChart();
}

// 7. [기능] 삭제하기 (HTML에서 호출할 수 있게 window에 등록)
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

// 8. [기능] 차트 그리기 함수
function updateChart() {
    // 카테고리별 합계 계산하기
    const categoryTotals = {
        "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0
    };

    expenses.forEach(expense => {
        if (categoryTotals[expense.category] !== undefined) {
            categoryTotals[expense.category] += expense.price;
        } else {
            categoryTotals["기타"] += expense.price;
        }
    });

    // 차트에 들어갈 데이터 준비
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // 기존 차트가 있으면 삭제
    if (myChart) {
        myChart.destroy();
    }

    // 차트 그리기
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: '지출 금액',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 차트 크기 자동 조절
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// 9. [기능] AI 분석 요청
analyzeButton.addEventListener("click", async function() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }

    resultDiv.innerHTML = "AI가 소비 내역을 분석 중입니다... 🤖";
    analyzeButton.disabled = true;

    // 리스트 데이터를 보기 좋은 문자열로 변환
    let diaryText = "최근 소비 내역입니다:\n";
    expenses.forEach(e => {
        diaryText += `- ${e.date} [${e.category}] ${e.item}: ${e.price}원\n`;
    });

    try {
        // Netlify 함수 호출
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