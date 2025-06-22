/*
 * 파일 이름: netlify/functions/get-realtors.js
 * '동' 단위 검색 기능이 명확하게 수정된 최종 버전입니다.
 * 이 코드가 register.html과 함께 작동하는 최종 서버 코드입니다.
 */
exports.handler = async function(event) {
  // 1. Netlify 환경 변수에서 Airtable 접속 정보를 안전하게 가져옵니다.
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = 'Realtors'; // Airtable에 설정된 테이블 이름

  // 2. 웹사이트에서 보낸 'district'(구)와 'dong'(동) 정보를 추출합니다.
  const { district, dong } = event.queryStringParameters;
  
  // 3. 'district'(구) 정보는 필수이므로, 없으면 에러를 반환합니다.
  if (!district) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'District is required' })
      };
  }

  // 4. *** 핵심 검색 로직 ***
  // 'dong'(동) 정보의 유무에 따라 Airtable에 보낼 검색 조건을 다르게 만듭니다.
  let filterFormula;

  // 4-1. 만약 사용자가 '동'까지 입력했다면 (dong 파라미터에 값이 있다면)
  if (dong && dong.trim() !== '') {
    // "District 필드가 사용자가 선택한 '구'와 같고(AND), Dong 필드도 사용자가 입력한 '동'과 같은" 데이터를 찾아달라고 요청합니다.
    filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  } else {
    // 4-2. 만약 사용자가 '구'까지만 선택했다면 (dong 파라미터가 비어 있다면)
    // "District 필드가 사용자가 선택한 '구'와 같은" 데이터만 찾아달라고 요청합니다.
    filterFormula = `{District} = "${district}"`;
  }

  // 5. 위에서 만든 검색 조건(filterFormula)을 포함하여 최종 API 요청 주소를 생성합니다.
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  // 'node-fetch' 라이브러리를 가져옵니다.
  const fetch = (await import('node-fetch')).default;

  try {
    // 6. Airtable 서버에 데이터를 요청합니다.
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`
      },
    });

    // 7. Airtable로부터 받은 응답이 정상이 아닐 경우 에러를 처리합니다.
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
    // 함수 실행 중 예측하지 못한 오류가 발생하면 에러를 처리합니다.
    console.error('Function execution error:', error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Function execution error.' }) 
    };
  }
};
