/*
 * 파일 이름: netlify/functions/get-realtors.js
 * 이 코드는 Airtable 및 Netlify 설정을 최종 점검하기 위한 디버깅용 코드입니다.
 * 이 코드를 배포한 후, Netlify의 함수 로그를 확인하면 문제의 정확한 원인을 찾을 수 있습니다.
 */

// 'handler'라는 이름으로 함수를 외부에 공개(export)해야 Netlify가 이 코드를 찾을 수 있습니다.
exports.handler = async function(event) {
  
  // --- 1. Netlify 환경 변수 (Environment variables) 확인 ---
  console.log("--- 함수 실행 시작 ---");
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  
  // Netlify가 환경 변수를 제대로 읽었는지 로그에 기록합니다.
  console.log("읽어온 Base ID 설정 여부:", AIRTABLE_BASE_ID ? "OK" : "ERROR: 설정되지 않음!");
  console.log("읽어온 Personal Token 설정 여부:", AIRTABLE_PERSONAL_TOKEN ? "OK" : "ERROR: 설정되지 않음!");

  // --- 2. Airtable 테이블 이름 확인 ---
  const AIRTABLE_TABLE_NAME = 'Realtors';
  console.log("사용할 테이블 이름:", AIRTABLE_TABLE_NAME);

  // --- 3. 웹사이트에서 보낸 파라미터 확인 ---
  const { district, dong } = event.queryStringParameters;
  console.log("요청받은 지역(district):", district);
  console.log("요청받은 지역(dong):", dong);
  
  if (!district) {
      return { statusCode: 400, body: JSON.stringify({ error: 'District is required' }) };
  }

  // --- 4. Airtable 필터링 공식 확인 ---
  // 이 부분이 정상 작동하려면 Airtable의 필드 이름이 정확히 'District'와 'Dong'이어야 합니다.
  let filterFormula;
  if (dong && dong.trim() !== '') {
    filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  } else {
    filterFormula = `{District} = "${district}"`;
  }
  
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  console.log("생성된 Airtable 요청 URL:", url);

  const fetch = (await import('node-fetch')).default;

  try {
    console.log("Airtable 서버에 데이터 요청을 보냅니다...");
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`
      },
    });

    console.log("Airtable 서버의 응답 상태 코드:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("!!! Airtable API가 에러를 반환했습니다:", errorBody);
      throw new Error(`Airtable API Error: Not Found`);
    }

    const data = await response.json();
    const count = data.records.length;
    console.log(`✅ 성공: '${district} ${dong}' 지역에서 ${count}개의 부동산을 찾았습니다.`);

    return { 
      statusCode: 200, 
      body: JSON.stringify({ count: count }) 
    };

  } catch (error) {
    console.error("!!! 최종 실행 중 에러가 발생했습니다:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Function execution error.' }) 
    };
  }
};
