/*
 * 최종 파일 경로: /netlify/functions/get-realtors.js
 * 이 코드가 모든 문제를 해결할 최종 버전입니다.
 * 이 파일 외에 다른 곳에 get-realtors.js 파일이 있으면 안 됩니다.
 */
exports.handler = async function(event) {
  // --- 1. Netlify 환경 변수 확인 ---
  console.log("--- 최종 디버깅 코드 실행 시작 ---");
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = '부동산DB';

  console.log("읽어온 Base ID 설정 여부:", AIRTABLE_BASE_ID ? "OK" : "ERROR: 설정되지 않음!");
  console.log("읽어온 Personal Token 설정 여부:", AIRTABLE_PERSONAL_TOKEN ? "OK" : "ERROR: 설정되지 않음!");

  const { district } = event.queryStringParameters;
  console.log("요청받은 지역(district):", district);
  
  if (!district) {
      console.log("오류: district 파라미터가 없습니다.");
      return { statusCode: 400, body: JSON.stringify({ error: 'District is required' }) };
  }

  // --- 2. Airtable API 요청 URL 확인 ---
  const filterFormula = `{District} = "${district}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  console.log("생성된 Airtable 요청 URL:", url);

  // 'node-fetch' 라이브러리를 가져옵니다.
  const fetch = (await import('node-fetch')).default;

  try {
    console.log("Airtable 서버에 데이터 요청을 보냅니다...");
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`,
      },
    });

    console.log("Airtable 서버의 응답 상태 코드:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("!!! Airtable API가 에러를 반환했습니다:", errorBody);
      throw new Error(`Airtable API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const count = data.records.length;
    console.log(`✅ 성공: '${district}' 지역에서 ${count}개의 부동산을 찾았습니다.`);

    return { statusCode: 200, body: JSON.stringify({ count: count }) };

  } catch (error) {
    console.error("!!! 최종 실행 중 에러가 발생했습니다:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Function execution error.' }) };
  }
};
