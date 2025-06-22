/*
 * 파일 이름: netlify/functions/get-realtors.js
 * '동' 단위로 검색하도록 필터링 로직이 수정된 최종 버전입니다.
 */
exports.handler = async function(event) {
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = 'Realtors';

  // NEW: 'dong' 파라미터를 추가로 받습니다.
  const { city, district, dong } = event.queryStringParameters;
  
  if (!district || !dong) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'District and Dong are required' })
      };
  }

  // NEW: Airtable 필터링 공식에 'Dong'을 추가합니다.
  const filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const fetch = (await import('node-fetch')).default;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}` },
    });

    if (!response.ok) {
      // ... (에러 처리 로직)
      const errorBody = await response.text();
      console.error(`Airtable API Error: ${response.statusText}`, errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `Airtable API Error: ${response.statusText}` }) };
    }

    const data = await response.json();
    const count = data.records.length;

    return { statusCode: 200, body: JSON.stringify({ count: count }) };

  } catch (error) {
    console.error('Function execution error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Function execution error.' }) };
  }
};
