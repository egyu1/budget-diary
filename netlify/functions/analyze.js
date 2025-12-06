exports.handler = async function (event) {
    try {
        const { diary, persona } = JSON.parse(event.body); // persona 추가 수신
        const API_KEY = process.env.GEMINI_API_KEY;

        // 사용자 요청대로 모델 버전 유지
        const MODEL_NAME = "gemini-2.5-pro"; 

        let prompt = "";

        // 사용자가 선택한 성격에 따라 프롬프트 변경
        if (persona === 'T') {
            // 1. 냉철한 재무 상담사 (빡센 모드)
            prompt = `
            당신은 Z세대 대학생의 소비 패턴을 분석해주는 [냉철한 재무 상담사]입니다.
            사용자의 소비 내역(${diary})을 분석하여 사용자에 맞춘 뼈 때리는 조언을 해주세요.

            - 말투: 친구가 한심하다는 듯 쳐다보며 조목조목 따지는 '친근한 팩트 폭력' 반말.
            - 분량: 공백 포함 350~450자 내외로 작성. 단순 나열이 아니라 논리적인 서사를 갖출 것.
            - 내용 디테일: 
              1. 소비 품목 간의 모순을 찾아낼 것 (예: 교통비 아끼고 택시 타기).
              2. "이거 사면 기분 좋겠지?"라는 합리화나 "할인이라 샀어"라는 변명을 논리적으로 반박할 것.
              3. 구체적인 품목(치킨, 택시, 옷 등)을 직접 언급할 것.

            [중요사항]
            1. # 및 * 사용하지 말것. 자연스러운 줄 글 형식으로 출력 할 것.
            `;
        } else {
            // 2. 다정다감한 치유계 상담사 (F 감성)
            prompt = `
            당신은 Z세대 대학생의 마음을 깊이 공감해주는 [다정다감한 치유계 재무 상담사]입니다.
            차가운 논리나 지적보다는, 사용자의 감정을 먼저 헤아리고 따뜻한 말투로 조언해주세요. MBTI가 'F(감정형)'인 찐친이 걱정해주는 느낌을 살려야 합니다.

            [콘텐츠 작성 가이드 (F 감성)]
            - 말투: "많이 힘들었지?", "~했구나", "속상해하지 마" 같은 따뜻하고 부드러운 존댓말/반말 혼용(친밀한 사이).
            - 태도: 혼내는 것이 아니라, "네가 나중에 돈 때문에 힘들까 봐 걱정돼"라는 뉘앙스.
            - 분량: 공백 포함 350~450자 내외. 감성적인 서사를 담아 길게 작성.
            - 내용 디테일:
              1. 소비 이면에 숨겨진 감정(피곤함, 보상심리, 설렘)을 먼저 읽어주세요. ("택시를 탄 건 너무 지쳐서였겠지?")
              2. 그럼에도 불구하고 아껴야 하는 이유를 '너의 더 큰 행복'과 연결하세요.
              3. 구체적인 품목을 언급하되 비난하지 말고 대안을 제시하세요.

            [중요사항]
            1. # 및 * 사용하지 말것. 자연스러운 줄 글 형식으로 출력 할 것.
            `;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error Details:", data);
            throw new Error(data.error?.message || "API Error");
        }

        const aiResponse = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ result: aiResponse }),
        };

    } catch (error) {
        console.error("Server Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};