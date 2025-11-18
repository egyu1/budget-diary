// 1. HTML 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const analyzeButton = document.getElementById('analyze-button');
const resultDiv = document.getElementById('result');

// 2. 데이터 저장소 (로컬 스토리지에서 불러오기)
// 브라우저에 저장된 'expenses'가 있으면 가져오고, 없으면 빈 배열 [] 로 시작
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// 화면이 켜지면 일단 저장된 목록부터 그려줌
renderExpenses();

// 3. [기능] 소비 내역 추가하기
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

// 4. [기능] 데이터 저장 및 화면 그리기 함수
function saveExpenses() {
    // 로컬 스토리지에 JSON 문자열로 변환해서 저장
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function renderExpenses() {
    expenseList.innerHTML = ''; // 목록 싹 비우고 다시 그림

    expenses.forEach(function(expense) {
        const li = document.createElement('li');
        li.style.borderBottom = "1px solid #eee";
        li.style.padding = "10px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        
        li.innerHTML = `
            <span>[${expense.category}] <strong>${expense.item}</strong> (${expense.date})</span>
            <span>${expense.price.toLocaleString()}원 <button onclick="deleteExpense(${expense.id})" style="margin-left:10px; color:red; border:none; background:none; cursor:pointer;">X</button></span>
        `;
        expenseList.appendChild(li);
    });
}

// 5. [기능] 삭제하기 (HTML에서 호출할 수 있게 window에 등록)
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
};

// 6. [기능] AI 분석 요청 (변경된 데이터 구조에 맞춤)
analyzeButton.addEventListener("click", async function() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }

    resultDiv.innerHTML = "AI가 소비 내역을 분석 중입니다... 🤖";
    analyzeButton.disabled = true;

    // 리스트 데이터를 보기 좋은 문자열로 변환 (AI가 읽기 편하게)
    let diaryText = "최근 소비 내역입니다:\n";
    expenses.forEach(e => {
        diaryText += `- ${e.date} [${e.category}] ${e.item}: ${e.price}원\n`;
    });

    try {
        // 기존 서버 함수 그대로 사용 (텍스트로 변환해서 보내니까 잘 작동함)
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

//차트 담당 코드
let myChart = null; // 차트 객체를 담을 변수

function updateChart() {
    // 1. 카테고리별 합계 계산하기
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

    // 2. 차트에 들어갈 데이터 준비
    const labels = Object.keys(categoryTotals); // ["식비", "쇼핑", ...]
    const data = Object.values(categoryTotals); // [15000, 30000, ...]

    // 3. 기존 차트가 있으면 삭제 (안 그러면 겹쳐서 그려짐)
    if (myChart) {
        myChart.destroy();
    }

    // 4. 차트 그리기
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut', // 'pie'나 'bar'로 바꿔보세요!
        data: {
            labels: labels,
            datasets: [{
                label: '지출 금액',
                data: data,
                backgroundColor: [
                    '#FF6384', // 식비 (분홍)
                    '#36A2EB', // 쇼핑 (파랑)
                    '#FFCE56', // 교통 (노랑)
                    '#4BC0C0', // 취미 (민트)
                    '#9966FF'  // 기타 (보라)
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom', // 범례 위치
                }
            }
        }
    });
}