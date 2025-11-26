// /netlify/functions/analyze.js 파일

exports.handler = async function (event) {
    // 1. 프론트엔드(script.js)가 보낸 일기 내용을 받습니다.
    const { diary } = JSON.parse(event.body);

    // 2. Netlify에서 API 키를 가져옵니다. (4.3 단계에서 설정)
    const API_KEY = process.env.GEMINI_API_KEY;

    // 3. 3단계에서 썼던 프롬프트와 동일합니다.
    const prompt = `
        당신은 매우 현명하고 친절한 재정 조언가입니다. 
        사용자가 제공한 '소비 통계 요약'과 '상세 소비 내역'을 분석해주세요.
        
        이미 계산된 낭비율과 목표 달성 여부가 제공되므로, 이를 기반으로 정확한 피드백을 주세요.
        목표를 달성했다면 칭찬을, 실패했다면 구체적인 개선점을 부드럽게 제안해주세요.
        이모티콘은 절대 사용하지 마세요.
        답변은 3문장 내외로 짧고 명확하게 해주세요.

        [사용자 데이터]
        ${diary}

        [답변 형식]
        평가: (목표 달성 여부에 따른 평가)
        조언: (구체적인 행동 지침)
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

        // 안전한 응답 처리
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