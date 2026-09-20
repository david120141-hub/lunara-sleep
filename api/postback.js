module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({
      success: false,
      error: 'Method not allowed. Use GET or POST.'
    }));
  }

  let params = {};

  try {
    if (req.query && Object.keys(req.query).length > 0) {
      params = { ...req.query };
    } else if (req.url) {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      params = Object.fromEntries(parsedUrl.searchParams);
    }

    if (req.method === 'POST' && req.body) {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {}
      }
      if (bodyData && typeof bodyData === 'object') {
        params = { ...params, ...bodyData };
      }
    }
  } catch (e) {
    params = {};
  }

  const sub3 = params.sub3 ? String(params.sub3).trim() : null;

  if (!sub3) {
    res.statusCode = 400;
    return res.end(JSON.stringify({
      success: false,
      error: 'sub3 is required'
    }));
  }

  const allowedKeys = ['sub3', 'payout', 'amount', 'value', 'transaction_id', 'txid'];
  const forwardParams = {};

  allowedKeys.forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && String(params[key]).trim() !== '') {
      forwardParams[key] = String(params[key]).trim();
    }
  });

  const appsScriptBaseUrl = process.env.APPS_SCRIPT_POSTBACK_URL;

  if (!appsScriptBaseUrl) {
    res.statusCode = 503;
    return res.end(JSON.stringify({
      success: false,
      error: 'APPS_SCRIPT_POSTBACK_URL environment variable is not configured'
    }));
  }

  try {
    const targetUrl = new URL(appsScriptBaseUrl);

    Object.keys(forwardParams).forEach((key) => {
      targetUrl.searchParams.set(key, forwardParams[key]);
    });

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Lunara-Vercel-Postback-Relay/1.0'
      }
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    res.statusCode = response.ok ? response.status : 502;
    return res.end(JSON.stringify(responseData));

  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({
      success: false,
      error: 'Failed to communicate with Google Apps Script: ' + err.message
    }));
  }
};
