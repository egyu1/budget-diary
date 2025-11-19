// /netlify/functions/analyze.js 파일

exports.handler = async function(event) {
    // 1. 프론트엔드(script.js)가 보낸 일기 내용을 받습니다.
    const { diary } = JSON.parse(event.body);

    // 2. Netlify에서 API 키를 가져옵니다. (4.3 단계에서 설정)
    const API_KEY = process.env.GEMINI_API_KEY;

    // 3. 3단계에서 썼던 프롬프트와 동일합니다.
    const prompt = `
        당신은 매우 현명하고 친절한 재정 조언가입니다. 
        사용자의 소비 일기를 보고, 충동구매나 불필요한 지출이 몇 퍼센트인지 분석해주세요.
        그리고 어떤 점을 고치면 좋을지 2~3문장으로 짧고 명확하게 조언해주세요.
        
        [사용자 일기 내용]
        ${diary}

        [분석 결과 포맷]
        낭비 지수: (퍼센트)%
        AI 조언: (여기에 조언)
    `;

    // 4. 3단계와 동일하게 Gemini API에 요청을 보냅니다.
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        { parts: [{ text: prompt }] }
                    ],
                }),
            }
        );

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // 5. AI의 답변을 프론트엔드(script.js)로 다시 돌려보냅니다.
        return {
            statusCode: 200,
            body: JSON.stringify({ result: aiResponse }),
        };

    } catch (error) {
        // 6. 에러가 나면 에러 메시지를 돌려보냅니다.
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "AI 분석 중 오류가 발생했습니다." }),
        };
    }
};