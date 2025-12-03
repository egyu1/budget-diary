exports.handler = async function (event) {
    try {
        const { diary } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY;
        const MODEL_NAME = "gemini-3-pro-preview"; // 사용자 요청 유지

        const prompt = `
            당신은 재정 분석 전문가입니다. 사용자의 소비 내역을 보고 다음 4가지 유형 중 하나로 분류하고 조언해주세요.
            
            [유형 리스트]
            - TYPE_A: 꼼꼼한 절약왕 (낭비가 적고 계획적임)
            - TYPE_B: 기분파 욜로족 (충동구매가 많고 감정적 소비)
            - TYPE_C: 맛집 탐방러 (식비 비중이 매우 높음)
            - TYPE_D: 물욕의 화신 (쇼핑 비중이 매우 높음)

            [데이터]
            ${diary}

            [응답 형식]
            반드시 아래 JSON 포맷으로만 응답하세요. (마크다운 없이 순수 JSON만)
            {
                "type_code": "TYPE_A",
                "type_name": "꼼꼼한 절약왕",
                "description": "당신은 정말 계획적인 소비를 하고 계시네요!",
                "advice": "구체적인 조언 내용 (낭비 항목 지적 및 목표 달성 여부 언급)"
            }
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
        );

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || "API Error");
        
        const aiResponse = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ result: aiResponse }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};