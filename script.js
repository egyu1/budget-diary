// 1. HTML 요소(Element)들을 '선택'해서 변수에 담아둡니다.
const diaryInput = document.querySelector("#diary-input");
const analyzeButton = document.querySelector("#analyze-button");
const resultDiv = document.querySelector("#result");



// 2. '분석' 버튼(analyzeButton)이 '클릭'되는지 계속 듣고(addEventListener) 있도록 설정합니다.
analyzeButton.addEventListener("click", async function() {
    
    // 3. 버튼이 클릭되면 여기 있는 코드들이 실행됩니다.
    const usersDiary = diaryInput.value;

    // 만약 사용자가 아무것도 입력하지 않았다면?
    if (usersDiary.trim() === "") {
        alert("일기 내용을 입력해주세요!");
        return; // 함수를 여기서 종료합니다.
    }

    // AI에게 요청하는 동안 사용자에게 알려줍니다.
    resultDiv.innerHTML = "AI가 열심히 분석 중입니다... 🤖";
    analyzeButton.disabled = true; // 버튼을 잠시 비활성화

    // 3-2. AI에게 보낼 '명령어(프롬프트)'를 만듭니다.
    const prompt = `
        당신은 매우 현명하고 친절한 재정 조언가입니다. 
        사용자의 소비 일기를 보고, 충동구매나 불필요한 지출이 몇 퍼센트인지 분석해주세요.
        그리고 어떤 점을 고치면 좋을지 2~3문장으로 짧고 명확하게 조언해주세요.
        
        [사용자 일기 내용]
        ${usersDiary}

        [분석 결과 포맷]
        낭비 지수: (퍼센트)%
        AI 조언: (여기에 조언)
    `;

    // 3-3. (핵심!) Gemini API에게 요청(fetch)을 보냅니다.
    try {
        const response = await fetch(
            // 👇👇👇 이 부분이 수정되었습니다! 👇👇👇
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST", // 데이터를 '보낸다'는 뜻
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ // 우리가 보낼 데이터 (프롬프트 포함)
                    contents: [
                        { parts: [{ text: prompt }] }
                    ],
                }),
            }
        );

        const data = await response.json(); // 응답을 JSON 형태로 변환
        
        // (중요!) AI의 실제 답변 텍스트는 data.candidates[0].content.parts[0].text 에 들어있습니다.
        const aiResponse = data.candidates[0].content.parts[0].text;

        // 3-5. 결과창에 AI의 답변을 표시합니다.
        resultDiv.textContent = aiResponse;

    } catch (error) {
        // 3-6. 만약 API 요청 중 에러가 발생하면?
        console.error("API 요청 중 오류 발생:", error);
        resultDiv.textContent = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    } finally {
        // 3-7. 분석이 성공하든 실패하든, 버튼을 다시 활성화합니다.
        analyzeButton.disabled = false;
    }
});