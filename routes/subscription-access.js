module.exports = async function subscriptionAccess(req) {
  if (process.env.CONTROL_PLANE_MODE !== 'subscription') return;
  const origin = process.env.IAM_API_URL;
  if (!origin) { const error = new Error('Subscription verification is not configured'); error.status = 503; throw error; }
  let response;
  try { response = await fetch(`${origin.replace(/\/$/, '')}/v3/api/auth/runtime/access`, {headers: {Authorization: req.get('authorization')}, signal: AbortSignal.timeout(5000), redirect: 'error'}); }
  catch { const error = new Error('Subscription verification unavailable'); error.status = 503; throw error; }
  if (!response.ok) { const error = new Error('ERP session or subscription is inactive'); error.status = [401,403].includes(response.status) ? response.status : 503; throw error; }
  const result = await response.json();
  if (!Array.isArray(result.permissions) || !Array.isArray(result.accessScopes) || !result.permissions.includes('MMMS-APP')) { const error = new Error('MMMS is not included in your current access'); error.status = 403; throw error; }
  req.auth.permissions = result.permissions; req.auth.accessScopes = result.accessScopes;
};
