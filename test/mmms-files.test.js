const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'mmms-file-isolated-test-secret-only';
process.env.MMMS_MAX_FILE_BYTES = '128';
const jwt = require('jsonwebtoken');
const app = require('../server');
test('MMMS attachments enforce authentication, scope, type, size and private downloads', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const organizationId = randomUUID(); const factoryId = randomUUID(); const files = [];
  const sign = (permissions, accessScopes = []) => jwt.sign({ sub: 'storage-test', permissions, accessScopes }, process.env.JWT_SECRET, { issuer: 'platform-iam', audience: 'platform-applications', expiresIn: '5m' });
  const token = sign(['*']);
  const endpoint = `${base}/api/ss/mmms/files?organizationId=${organizationId}&factoryId=${factoryId}`;
  const upload = (text, type, access = token) => { const body = new FormData(); body.append('files', new Blob([text], { type }), 'manual.txt'); return fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${access}` }, body }); };
  try {
    assert.equal((await fetch(endpoint, { method: 'POST' })).status, 401);
    const other = sign(['MMMS-FILES-CREATE', 'MMMS-FILES-VIEW'], [{ applicationName: 'MMMS', organizationId, factoryId: 'other-factory' }]);
    assert.equal((await upload('private', 'text/plain', other)).status, 403);
    assert.equal((await upload('<svg></svg>', 'image/svg+xml')).status, 422);
    assert.equal((await upload('x'.repeat(129), 'text/plain')).status, 422);
    const response = await upload('Synthetic maintenance manual', 'text/plain');
    assert.equal(response.status, 201);
    const file = (await response.json()).result[0]; files.push(file);
    assert.match(file.id, /^[a-f0-9-]{36}\.txt$/);
    assert.equal((await fetch(base + file.url)).status, 401);
    assert.equal((await fetch(base + file.url, { headers: { authorization: `Bearer ${other}` } })).status, 403);
    const download = await fetch(base + file.url, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(download.status, 200);
    assert.equal(await download.text(), 'Synthetic maintenance manual');
    assert.match(download.headers.get('content-disposition'), /^attachment/);
    const suffix = `/${organizationId}/${factoryId}/${file.id}`;
    assert.equal((await fetch(base + '/api/ss/uploads/mmms' + suffix)).status, 404);
    assert.equal((await fetch(base + '/api/ss/uploads/%6d%6d%6ds' + suffix)).status, 404);
    const legacyPublic = '/api/cfss/U2FsdGVkX1968EpP4fSsYPWixZ9DT%2FeO0Gs9v4ppYsU%3D';
    assert.equal((await fetch(base + legacyPublic + '/mmms' + suffix)).status, 404);
    assert.equal((await fetch(base + legacyPublic + '/%6d%6d%6ds' + suffix)).status, 404);
    assert.equal((await fetch(base + '/api/cfss/mmms/files?organizationId=' + organizationId + '&factoryId=' + factoryId, { method: 'POST' })).status, 401);
  } finally {
    for (const file of files) await fs.unlink(path.resolve(__dirname, '../uploads/mmms', organizationId, factoryId, file.id));
    await new Promise((resolve) => server.close(resolve));
  }
});
