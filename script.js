// 1. HTML 요소(Element)들을 '선택'해서 변수에 담아둡니다.
const diaryInput = document.querySelector("#diary-input");
const analyzeButton = document.querySelector("#analyze-button");
const resultDiv = document.querySelector("#result");

analyzeButton.addEventListener("click", async function() {
    
    const usersDiary = diaryInput.value;

    if (usersDiary.trim() === "") {
        alert("일기 내용을 입력해주세요!");
        return;
    }

    resultDiv.innerHTML = "AI가 열심히 분석 중입니다... 🤖";
    analyzeButton.disabled = true;

    // 3. (핵심!) Google API가 아닌, 우리 '서버 함수'를 호출합니다.
    try {
        const response = await fetch(
            // 👇👇👇 호출 주소가 Google이 아닌 우리 서버입니다. 👇👇👇
            `/.netlify/functions/analyze`, 
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // 👇👇👇 API 키 대신, 일기 내용을 보냅니다. 👇👇👇
                body: JSON.stringify({ diary: usersDiary }), 
            }
        );

        const data = await response.json(); // 서버 함수가 보낸 응답을 받음

        if (response.status !== 200) {
            // 서버 함수가 에러를 보냈을 경우
            throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
        }
        
        // 4. (핵심!) 서버 함수가 보내준 '결과(result)'를 표시합니다.
        const aiResponse = data.result;
        resultDiv.textContent = aiResponse;

    } catch (error) {
        console.error("요청 중 오류 발생:", error);
        resultDiv.textContent = `오류: ${error.message}`;
    } finally {
        analyzeButton.disabled = false;
    }
});