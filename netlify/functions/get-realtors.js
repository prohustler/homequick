/*
 * 파일 이름: netlify/functions/get-realtors.js
 * 가장 안정적인 방식으로 수정된 최종 버전의 서버 코드입니다.
 */

// 1. 가장 안정적인 'require' 방식으로 node-fetch 도구를 불러옵니다.
const fetch = require('node-fetch');

// 2. 'handler'라는 이름으로 함수를 외부에 공개(export)합니다.
exports.handler = async function(event) {
  
  // 3. Netlify 환경 변수에서 Airtable 접속 정보를 안전하게 가져옵니다.
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = 'Realtors';

  // 4. 웹사이트에서 보낸 'district'(구)와 'dong'(동) 정보를 추출합니다.
  const { district, dong } = event.queryStringParameters;
  
  if (!district) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'District is required' })
      };
  }

  // 5. '동' 정보 유무에 따라 Airtable에 보낼 검색 조건을 다르게 만듭니다.
  let filterFormula;
  if (dong && dong.trim() !== '') {
    filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  } else {
    filterFormula = `{District} = "${district}"`;
  }

  // 6. 위에서 만든 검색 조건(filterFormula)을 포함하여 최종 API 요청 주소를 생성합니다.
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  try {
    // 7. Airtable 서버에 데이터를 요청합니다.
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Airtable API Error: ${response.statusText}`, errorBody);
      throw new Error(`Airtable API Error: ${response.status}`);
    }

    // 8. 성공적으로 응답을 받으면, 받은 데이터에서 부동산 개수를 계산합니다.
    const data = await response.json();
    const count = data.records.length;

    // 9. 계산된 부동산 개수를 웹사이트에 전달합니다.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ count: count }) 
    };

  } catch (error) {
    console.error('Function execution error:', error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Function execution error.' }) 
    };
  }
};