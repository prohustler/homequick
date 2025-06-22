\/*
 * 파일 이름: netlify/functions/get-realtors.js
 * 이 코드는 Airtable 및 Netlify 설정을 최종 점검하기 위한 체크리스트 역할을 합니다.
 * 아래 주석의 내용을 보시고, 사용자님의 실제 설정과 다른 부분이 없는지 마지막으로 확인해주세요.
 */

// 'handler'라는 이름으로 함수를 외부에 공개(export)해야 Netlify가 이 코드를 찾을 수 있습니다.
exports.handler = async function(event) {
  
  // --- ✅ 체크리스트 1: Netlify 환경 변수 (Environment variables) ---
  // 이 코드는 Netlify 프로젝트 설정에 저장된 '비밀번호'를 읽어옵니다.
  // Netlify 프로젝트 > Site configuration > Build & deploy > Environment 에
  // 아래 두 변수가 정확한 이름과 값으로 저장되어 있는지 확인해주세요.
  
  // [Key] AIRTABLE_PERSONAL_TOKEN  <-> [Value] pat...로 시작하는 긴 토큰
  // [Key] AIRTABLE_BASE_ID         <-> [Value] app...로 시작하는 Base ID
  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  
  // --- ✅ 체크리스트 2: Airtable 테이블 이름 ---
  // Airtable에 있는 테이블의 이름이 아래와 정확히 'Realtors' (대소문자 포함)로 되어 있는지 확인해주세요.
  const AIRTABLE_TABLE_NAME = 'Realtors';

  // --- 여기서부터는 코드의 자동 처리 영역입니다 ---

  // 웹사이트에서 보낸 'district'(구)와 'dong'(동) 정보를 추출합니다.
  const { district, dong } = event.queryStringParameters;
  
  // 'district'(구) 정보는 필수입니다.
  if (!district) {
      return {
          statusCode: 400,
          body: JSON.stringify({ error: 'District is required' })
      };
  }

  // --- ✅ 체크리스트 3: Airtable 필드(열) 이름 ---
  // '동' 정보 유무에 따라 Airtable에 보낼 검색 조건을 만듭니다.
  // 이 부분이 정상적으로 작동하려면, Airtable의 'Realtors' 테이블에
  // 필드(열) 이름이 정확히 'District'와 'Dong' (첫 글자 대문자)으로 되어 있어야 합니다.
  let filterFormula;
  if (dong && dong.trim() !== '') {
    // '동'까지 입력된 경우, {District}와 {Dong} 필드를 모두 검색합니다.
    filterFormula = `AND({District} = "${district}", {Dong} = "${dong}")`;
  } else {
    // '구'까지만 선택된 경우, {District} 필드만 검색합니다.
    filterFormula = `{District} = "${district}"`;
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;
  
  const fetch = (await import('node-fetch')).default;

  try {
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

    const data = await response.json();
    const count = data.records.length;

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
