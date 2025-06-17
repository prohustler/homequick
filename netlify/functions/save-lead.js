exports.handler = async function(event) {
  // POST 요청이 아니면 에러 처리
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { AIRTABLE_PERSONAL_TOKEN, AIRTABLE_BASE_ID } = process.env;
  const LEADS_TABLE_NAME = 'Leads';

  const fetch = (await import('node-fetch')).default;
  
  try {
    // 클라이언트가 보낸 매물 데이터를 JSON으로 파싱
    const fields = JSON.parse(event.body);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LEADS_TABLE_NAME)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Airtable API 형식에 맞게 데이터를 포맷
      body: JSON.stringify({
        "records": [
          {
            "fields": fields
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Airtable API Error (save-lead):", errorBody);
      throw new Error(`Airtable API Error: ${response.statusText}`);
    }

    // 성공적으로 저장되면 200 OK 응답
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Lead saved successfully' }),
    };

  } catch (error) {
    console.error("Error in save-lead function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save lead' }),
    };
  }
};
