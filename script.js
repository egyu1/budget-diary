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