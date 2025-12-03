// 1. 요소 가져오기
const dateInput = document.getElementById('date-input');
const categoryInput = document.getElementById('category-input');
const itemInput = document.getElementById('item-input');
const priceInput = document.getElementById('price-input');
const impulseInput = document.getElementById('impulse-input');
const emotionInput = document.getElementById('emotion-input');
const addButton = document.getElementById('add-button');
const expenseList = document.getElementById('expense-list');
const resultDiv = document.getElementById('result');

const totalAmountEl = document.getElementById('total-amount');
const wasteAmountEl = document.getElementById('waste-amount');
const wasteRateEl = document.getElementById('waste-rate');
const goalStatusEl = document.getElementById('goal-status');
const goalInput = document.getElementById('goal-input');
const userPointsEl = document.getElementById('user-points'); // (NEW)

const btnPC = document.getElementById('analyze-button-pc');
const btnMobile = document.getElementById('analyze-button-mobile');

// AI 페르소나 관련 요소 (NEW)
const aiPersonaContainer = document.getElementById('ai-persona-container');
const personaImage = document.getElementById('persona-image');
const personaTitle = document.getElementById('persona-title');
const personaDesc = document.getElementById('persona-desc');

// 2. 데이터 초기화
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0; // (NEW) 포인트
let userGoal = localStorage.getItem('userGoal') || 20;

let monthlyChart = null;
let todayChart = null;

// 초기화 실행
goalInput.value = userGoal;
updatePointsDisplay();
renderExpenses();
renderCalendar(); // (NEW) 달력 그리기

// 이벤트 리스너
impulseInput.addEventListener('change', function() {
    if (this.checked) {
        emotionInput.style.display = 'block';
        emotionInput.focus();
    } else {
        emotionInput.style.display = 'none';
        emotionInput.value = '';
    }
});

goalInput.addEventListener('input', function() {
    userGoal = goalInput.value;
    localStorage.setItem('userGoal', userGoal);
    updateSummary();
});

// 3. 추가하기
addButton.addEventListener('click', function() {
    const date = dateInput.value;
    const category = categoryInput.value;
    const item = itemInput.value;
    const price = priceInput.value;
    const isImpulse = impulseInput.checked;
    const emotion = isImpulse ? emotionInput.value : '';

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
        emotion: emotion
    };

    expenses.push(expense);
    saveExpenses();
    renderExpenses();
    renderCalendar(); // 달력 갱신

    // 초기화
    itemInput.value = '';
    priceInput.value = '';
    impulseInput.checked = false;
    emotionInput.value = '';
    emotionInput.style.display = 'none';
});

// 데이터 저장
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 화면 그리기 (리스트)
function renderExpenses() {
    expenseList.innerHTML = '';
    const sortedExpenses = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedExpenses.forEach(function(expense) {
        const li = document.createElement('li');
        if (expense.isImpulse) li.classList.add('impulse');
        
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

// 삭제
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
    renderCalendar();
};

// (NEW) 주간 통계 및 포인트 계산
function updateSummary() {
    // 이번주 날짜 구하기 (월~일)
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // 월요일
    const last = first + 6; // 일요일
    
    // 날짜 비교를 위해 Date 객체로 변환 가능한 문자열 범위 설정 (단순화: 여기선 정확한 날짜 계산보다 개념 구현 위주)
    // 실제로는 moment.js 등을 쓰면 좋지만, 간단하게 이번주 포함 여부 필터링
    
    // 이번 주 데이터만 필터링 (간단 로직: 오늘 기준으로 최근 7일로 대체하거나, 실제 주차 계산)
    // 여기선 '이번 주(월~일)' 로직을 위해 현재 날짜 기준으로 같은 주인지 판단하는 헬퍼 함수 사용한다고 가정
    // 복잡함을 피하기 위해 "오늘 포함 최근 7일"로 로직 단순화하여 구현
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);

    const total = weeklyExpenses.reduce((sum, item) => sum + item.price, 0);
    const waste = weeklyExpenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);

    totalAmountEl.textContent = total.toLocaleString() + "원";
    wasteAmountEl.textContent = waste.toLocaleString() + "원";
    wasteRateEl.textContent = rate + "%";

    if (total === 0) {
        goalStatusEl.textContent = ""; 
    } else if (rate < userGoal) {
        goalStatusEl.textContent = "성공! (+포인트 지급가능)";
        goalStatusEl.style.color = "#4BC0C0"; 
    } else {
        goalStatusEl.textContent = "관리 필요";
        goalStatusEl.style.color = "#FF6B6B"; 
    }
}

// (NEW) 포인트 관련 함수
function updatePointsDisplay() {
    userPointsEl.textContent = userPoints.toLocaleString() + " P";
    localStorage.setItem('userPoints', userPoints);
}

// 상점에서 물건 사기
window.buyItem = function(cost, name) {
    if (userPoints >= cost) {
        if(confirm(`${name}을(를) 교환하시겠습니까? (-${cost}P)`)) {
            userPoints -= cost;
            updatePointsDisplay();
            alert(`${name} 교환 완료! 쿠폰함(예시)을 확인하세요.`);
        }
    } else {
        alert("포인트가 부족합니다! 목표를 달성해서 포인트를 모아보세요.");
    }
}

// (NEW) 달력 그리기 (이번 달 기준)
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); // 0부터 시작
    
    const firstDay = new Date(year, month, 1).getDay(); // 1일의 요일
    const lastDate = new Date(year, month + 1, 0).getDate(); // 마지막 날짜

    // 빈 칸 채우기
    for(let i=0; i<firstDay; i++) {
        calendarGrid.innerHTML += `<div></div>`;
    }

    // 날짜 채우기
    for(let i=1; i<=lastDate; i++) {
        // 해당 날짜의 지출 찾기
        const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayExpenses = expenses.filter(e => e.date === dayStr);
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.price, 0);
        const isWaste = dayExpenses.some(e => e.isImpulse); // 낭비가 하나라도 있으면

        let html = `<div class="calendar-day ${isWaste ? 'waste-day' : ''}">
            <div class="day-number">${i}</div>`;
        
        if(dayTotal > 0) {
            html += `<div class="day-expense">${dayTotal.toLocaleString()}</div>`;
            if(isWaste) html += `<div class="day-waste">⚠</div>`;
        }
        
        html += `</div>`;
        calendarGrid.innerHTML += html;
    }
}

// 차트 그리기
function updateChart() {
    const monthTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };
    // 이번주 데이터 (오늘 기준 최근 7일)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // 차트용 데이터 집계 (주간 추이는 카테고리별이 아니라 일자별로 하면 좋겠지만 기존 유지)
    const todayTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };

    expenses.forEach(expense => {
        // 월간 집계
        if (monthTotals[expense.category] !== undefined) monthTotals[expense.category] += expense.price;
        else monthTotals["기타"] += expense.price;

        // 주간 집계
        if (new Date(expense.date) >= oneWeekAgo) {
             if (todayTotals[expense.category] !== undefined) todayTotals[expense.category] += expense.price;
            else todayTotals["기타"] += expense.price;
        }
    });

    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', labels: { font: { size: 10 }, boxWidth: 10 } } }
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
                label: '최근 7일',
                data: Object.values(todayTotals),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderRadius: 5
            }]
        },
        options: { ...commonOptions, scales: { y: { beginAtZero: true } } }
    });
}

// AI 분석
async function runAnalysis() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }
    
    resultDiv.innerHTML = "AI가 소비 패턴을 분석하고 있습니다... ⏳";
    if(btnPC) btnPC.disabled = true;
    if(btnMobile) btnMobile.disabled = true;
    
    // 분석 전 이미지 숨김
    aiPersonaContainer.style.display = 'none';

    // 데이터 준비
    const sortedForAI = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentItems = sortedForAI.slice(0, 15);
    
    // (NEW) 주간 목표 달성 시 포인트 지급 로직을 위해 데이터 전송
    const total = expenses.reduce((sum, item) => sum + item.price, 0);
    const waste = expenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);
    
    // 포인트 지급: 목표 달성 시 (목표 20% 이하면 500P, 10% 이하면 1000P 지급 등 차등 지급)
    // 단순히 분석 버튼 누를 때 계산해서 지급 (데모용)
    if (total > 0 && rate < userGoal) {
        // 목표가 낮을수록(어려울수록) 더 많은 포인트 (예: (100 - 목표) * 10)
        const bonusPoints = (100 - userGoal) * 10;
        userPoints += bonusPoints;
        updatePointsDisplay();
        alert(`🎉 주간 목표 달성! ${bonusPoints} 포인트가 지급되었습니다!`);
    }

    let diaryText = `
    [통계]
    - 총 지출: ${total}원
    - 낭비율: ${rate}% (목표: ${userGoal}% 미만)
    [내역]
    `;
    recentItems.forEach(e => {
        let marker = e.isImpulse ? `[낭비: ${e.emotion || '이유 없음'}]` : "";
        diaryText += `- ${e.category}: ${e.item} (${e.price}원) ${marker}\n`;
    });

    try {
        const response = await fetch('/.netlify/functions/analyze', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ diary: diaryText }), 
        });

        if (!response.ok) throw new Error("서버 오류");

        const data = await response.json();
        
        // (NEW) AI 응답 파싱 (JSON 형태라고 가정하고 처리하거나, 텍스트에서 추출)
        // analyze.js에서 JSON을 반환하도록 프롬프트를 짰으므로 파싱 시도
        try {
            // AI가 ```json ... ``` 형태로 줄 수도 있으므로 처리
            let cleanJson = data.result.replace(/```json|```/g, '').trim();
            const aiData = JSON.parse(cleanJson);
            
            // 이미지 표시
            aiPersonaContainer.style.display = 'block';
            personaTitle.textContent = aiData.type_name; // 예: "알뜰한 다람쥐"
            personaDesc.textContent = aiData.description;
            resultDiv.textContent = aiData.advice;
            
            // 유형별 이미지 매핑 (임시 이미지 URL 사용)
            // 실제 조원들이 만든 이미지가 있다면 파일명으로 교체 (ex: 'images/type_a.png')
            const images = {
                "TYPE_A": "https://cdn-icons-png.flaticon.com/512/4140/4140048.png", // 절약형
                "TYPE_B": "https://cdn-icons-png.flaticon.com/512/4140/4140037.png", // 충동형
                "TYPE_C": "https://cdn-icons-png.flaticon.com/512/4140/4140047.png", // 미식가
                "TYPE_D": "https://cdn-icons-png.flaticon.com/512/4140/4140051.png"  // 지름신
            };
            personaImage.src = images[aiData.type_code] || images["TYPE_A"];

        } catch (e) {
            // JSON 파싱 실패 시 그냥 텍스트로 뿌림
            resultDiv.textContent = data.result;
        }

    } catch (error) {
        console.error(error);
        resultDiv.textContent = "분석 중 오류가 발생했습니다.";
    } finally {
        if(btnPC) btnPC.disabled = false;
        if(btnMobile) btnMobile.disabled = false;
    }
}

if(btnPC) btnPC.addEventListener("click", runAnalysis);
if(btnMobile) btnMobile.addEventListener("click", runAnalysis);