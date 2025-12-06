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
const userPointsEl = document.getElementById('user-points');

const btnPC = document.getElementById('analyze-button-pc');
const btnMobile = document.getElementById('analyze-button-mobile');

const aiPersonaContainer = document.getElementById('ai-persona-container');
const personaImage = document.getElementById('persona-image');
const personaTitle = document.getElementById('persona-title');
const personaDesc = document.getElementById('persona-desc');

// 2. 데이터 초기화
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let userGoal = localStorage.getItem('userGoal') || 20;

const MIN_RECORD_DAYS = 3; 

let monthlyChart = null;
let todayChart = null;

goalInput.value = userGoal;
updatePointsDisplay();
renderExpenses();
renderCalendar();

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
    renderCalendar();

    itemInput.value = '';
    priceInput.value = '';
    impulseInput.checked = false;
    emotionInput.value = '';
    emotionInput.style.display = 'none';
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
    renderCalendar();
};

function getCurrentWeekID() {
    const d = new Date();
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0]; 
}

function updateSummary() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);

    const total = weeklyExpenses.reduce((sum, item) => sum + item.price, 0);
    const waste = weeklyExpenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);

    const recordedDays = new Set(weeklyExpenses.map(e => e.date)).size;

    totalAmountEl.textContent = total.toLocaleString() + "원";
    wasteAmountEl.textContent = waste.toLocaleString() + "원";
    wasteRateEl.textContent = rate + "%";

    const lastAwardedWeek = localStorage.getItem('lastAwardedWeek');
    const currentWeekID = getCurrentWeekID();
    const isAwarded = lastAwardedWeek === currentWeekID;

    if (total === 0) {
        goalStatusEl.textContent = "기록 없음";
        goalStatusEl.style.color = "#888";
    } else if (recordedDays < MIN_RECORD_DAYS) {
        goalStatusEl.textContent = `부족 (${recordedDays}/${MIN_RECORD_DAYS}일)`;
        goalStatusEl.style.color = "#FFA502"; 
    } else if (rate < userGoal) {
        if (isAwarded) {
            goalStatusEl.textContent = "지급 완료";
            goalStatusEl.style.color = "#888";
        } else {
            goalStatusEl.textContent = "성공! (포인트 가능)";
            goalStatusEl.style.color = "#4BC0C0"; 
        }
    } else {
        goalStatusEl.textContent = "목표 실패";
        goalStatusEl.style.color = "#FF6B6B"; 
    }
}

function updatePointsDisplay() {
    userPointsEl.textContent = userPoints.toLocaleString() + " P";
    localStorage.setItem('userPoints', userPoints);
}

window.buyItem = function(cost, name) {
    if (userPoints >= cost) {
        if(confirm(`${name}을(를) 교환하시겠습니까? (-${cost}P)`)) {
            userPoints -= cost;
            updatePointsDisplay();
            alert(`${name} 교환 완료!`);
        }
    } else {
        alert("포인트가 부족합니다!");
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const firstDay = new Date(year, month, 1).getDay(); 
    const lastDate = new Date(year, month + 1, 0).getDate(); 

    for(let i=0; i<firstDay; i++) {
        calendarGrid.innerHTML += `<div></div>`;
    }

    for(let i=1; i<=lastDate; i++) {
        const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayExpenses = expenses.filter(e => e.date === dayStr);
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.price, 0);
        const isWaste = dayExpenses.some(e => e.isImpulse);

        let html = `<div class="calendar-day ${isWaste ? 'waste-day' : ''}">
            <div class="day-number">${i}</div>`;
        
        if(dayTotal > 0) {
            html += `<div class="day-expense">${dayTotal.toLocaleString()}</div>`;
            if(isWaste) html += `<div class="day-waste">⚠</div>`;

            let tooltipHtml = `<div class="expense-tooltip"><strong>${month+1}월 ${i}일</strong><ul>`;
            dayExpenses.forEach(e => {
                 tooltipHtml += `<li>[${e.category}] ${e.item} : ${e.price.toLocaleString()}원</li>`;
            });
            tooltipHtml += `</ul></div>`;
            html += tooltipHtml;
        }
        html += `</div>`;
        calendarGrid.innerHTML += html;
    }
}

function updateChart() {
    const monthTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const todayTotals = { "식비": 0, "쇼핑": 0, "교통": 0, "취미": 0, "기타": 0 };

    expenses.forEach(expense => {
        if (monthTotals[expense.category] !== undefined) monthTotals[expense.category] += expense.price;
        else monthTotals["기타"] += expense.price;

        if (new Date(expense.date) >= oneWeekAgo) {
             if (todayTotals[expense.category] !== undefined) todayTotals[expense.category] += expense.price;
            else todayTotals["기타"] += expense.price;
        }
    });

    if (monthlyChart) monthlyChart.destroy();
    if (todayChart) todayChart.destroy();

    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', labels: { font: { size: 10 }, boxWidth: 10 } } }
    };

    const monthCtx = document.getElementById('monthlyChart').getContext('2d');
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

function getPersonaImage(rate) {
    if (rate < 25) {
        return { src: "media/char1.png", title: "꼼꼼한 다람쥐", desc: "낭비율 0~24%: 완벽해요!" };
    } else if (rate < 50) {
        return { src: "media/char2.png", title: "합리적인 부엉이", desc: "낭비율 25~49%: 조금만 더 신경써요." };
    } else if (rate < 75) {
        return { src: "media/char3.png", title: "신나는 여우", desc: "낭비율 50~74%: 충동구매 주의!" };
    } else {
        return { src: "media/char4.png", title: "플렉스 고양이", desc: "낭비율 75% 이상: 심각합니다." };
    }
}

async function runAnalysis() {
    if (expenses.length === 0) {
        alert("분석할 내역이 없습니다!");
        return;
    }
    
    resultDiv.innerHTML = "상담사가 데이터를 분석하고 있습니다... ⏳";
    if(btnPC) btnPC.disabled = true;
    if(btnMobile) btnMobile.disabled = true;
    aiPersonaContainer.style.display = 'none';

    // 1. 계산
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    
    const total = weeklyExpenses.reduce((sum, item) => sum + item.price, 0);
    const waste = weeklyExpenses.filter(item => item.isImpulse).reduce((sum, item) => sum + item.price, 0);
    const rate = total === 0 ? 0 : Math.round((waste / total) * 100);
    const recordedDays = new Set(weeklyExpenses.map(e => e.date)).size;

    // 2. 이미지 표시
    const persona = getPersonaImage(rate);
    personaImage.src = persona.src;
    personaTitle.textContent = persona.title;
    personaDesc.textContent = persona.desc;
    aiPersonaContainer.style.display = 'block';

    // 3. 포인트 지급 체크 (로직 점검 완료)
    const currentWeekID = getCurrentWeekID();
    const lastAwardedWeek = localStorage.getItem('lastAwardedWeek');
    let goalMsg = "";

    if (total > 0 && rate < userGoal) {
        if (recordedDays < MIN_RECORD_DAYS) {
             goalMsg = "목표 달성했으나 데이터 부족";
             alert(`⚠️ 포인트 지급 불가: 데이터 부족!\n(현재 ${recordedDays}일 / 최소 ${MIN_RECORD_DAYS}일 기록 필요)`);
        } else if (currentWeekID !== lastAwardedWeek) {
            const bonusPoints = (100 - userGoal) * 10;
            userPoints += bonusPoints;
            updatePointsDisplay();
            localStorage.setItem('lastAwardedWeek', currentWeekID);
            alert(`🎉 축하합니다! 주간 목표 달성!\n보너스 ${bonusPoints} P 지급!`);
            goalMsg = "목표 달성 성공 (포인트 지급됨)";
        } else {
             goalMsg = "이미 지급됨";
             alert("이번 주 포인트는 이미 지급되었습니다. 다음 주에 도전하세요!");
        }
    } else {
        goalMsg = "목표 실패";
    }
    updateSummary();

    // 4. AI에게 텍스트 요청
    // 사용자가 선택한 성격(persona) 값 가져오기
    const selectedPersona = document.querySelector('input[name="ai-persona"]:checked').value;

    let diaryText = `
    [주간 통계]
    - 총 지출: ${total}원, 낭비율: ${rate}% (목표: ${userGoal}%)
    - 상태: ${goalMsg}
    [최근 내역]
    `;
    const sortedForAI = expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedForAI.slice(0, 15).forEach(e => {
        let marker = e.isImpulse ? `[낭비: ${e.emotion || '이유없음'}]` : "";
        diaryText += `- ${e.category}: ${e.item} (${e.price}원) ${marker}\n`;
    });

    try {
        const response = await fetch('/.netlify/functions/analyze', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // persona 값도 함께 전송
            body: JSON.stringify({ diary: diaryText, persona: selectedPersona }), 
        });

        if (!response.ok) throw new Error("서버 오류");
        const data = await response.json();
        
        resultDiv.textContent = data.result;

    } catch (error) {
        console.error(error);
        resultDiv.textContent = "AI 서버 오류가 발생했습니다. (잠시 후 다시 시도)";
    } finally {
        if(btnPC) btnPC.disabled = false;
        if(btnMobile) btnMobile.disabled = false;
    }
}

if(btnPC) btnPC.addEventListener("click", runAnalysis);
if(btnMobile) btnMobile.addEventListener("click", runAnalysis);