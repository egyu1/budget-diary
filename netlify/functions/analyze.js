exports.handler = async function (event) {
    const { diary } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    // 프롬프트 수정: 통계 기반 분석 및 이모티콘 금지
    const prompt = `
        당신은 현명하고 친절한 재정 조언가입니다. 
        사용자가 제공한 '현재 소비 통계'와 '최근 소비 내역'을 분석해주세요.
        
        특히 사용자가 설정한 목표(낭비율 20% 미만) 달성 여부에 대해 언급하고 격려하거나 따끔하게 조언해주세요.
        낭비라고 체크된 항목들을 중심으로 어떤 점을 고치면 좋을지 구체적으로 2~3문장으로 조언해주세요.
        
        [데이터]
        ${diary}

        [분석 결과 포맷]
        AI 총평: (여기에 조언)
        구체적인 개선점: (여기에 조언)
    `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                }),
            }
        );

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "AI 응답을 받아오지 못했습니다." }),
            };
        }

        const aiResponse = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ result: aiResponse }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "서버 오류가 발생했습니다." }),
        };
    }
};