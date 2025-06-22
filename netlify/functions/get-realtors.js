/*
 * 파일 이름: netlify/functions/get-realtors.js
 * '동'이 선택 사항일 경우를 처리하도록 필터링 로직이 개선된 최종 버전입니다.
 */
exports.handler = async function(event) {
  // Netlify 환경 변수에서 Airtable 접속 정보를 가져옵니다.
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const AIRTABLE_TABLE_NAME = 'Realtors'; // Airtable에 설정된 테이블 이름

  // 클라이언트에서 보낸 'city', 'district', 'dong' 파라미터를 추출합니다.
  const { city, district, dong } = event.queryStringParameters;
  
  // 'district'는 필수 값이므로, 없으면 에러를 반환합니다.
  if (!district) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'District is required' })
      };
  }

  // '동' 정보 유무에 따라 필터링 공식을 동적으로 생성합니다.
  let filterFormula;
  if (dong) {
    // '동'이 입력된 경우: '구'와 '동'을 모두 만족하는 데이터를 찾습니다.
    filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  } else {
    // '동'이 입력되지 않은 경우: '구'만 만족하는 데이터를 찾습니다.
    filterFormula = `{District} = "${district}"`;
  }

  // Airtable API에 요청할 최종 URL을 만듭니다.
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  // 'node-fetch' 라이브러리를 가져옵니다.
  const fetch = (await import('node-fetch')).default;

  try {
    // Airtable 서버에 데이터를 요청합니다.
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`
      },
    });

    // Airtable로부터 받은 응답이 정상이 아닐 경우 에러를 처리합니다.
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Airtable API Error: ${response.statusText}`, errorBody);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: `Airtable API Error: ${response.statusText}` }) 
      };
    }

    // 응답받은 데이터를 JSON 형태로 변환합니다.
    const data = await response.json();
    // 찾아낸 부동산의 총 개수를 계산합니다.
    const count = data.records.length;

    // 성공적으로 처리되었으면, 부동산 개수를 담아 클라이언트에 응답합니다.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ count: count }) 
    };

  } catch (error) {
    // 함수 실행 중 예측하지 못한 오류가 발생하면 에러를 처리합니다.
    console.error('Function execution error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Function execution error.' }) 
    };
  }
};
