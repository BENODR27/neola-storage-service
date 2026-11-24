const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const router = express.Router();
const root = path.resolve(__dirname, '../uploads/mmms');
const allowed = new Map([
  ['image/png', '.png'], ['image/jpeg', '.jpg'], ['image/webp', '.webp'], ['application/pdf', '.pdf'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['audio/webm', '.webm'], ['audio/mpeg', '.mp3'], ['audio/wav', '.wav'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'], ['text/plain', '.txt'], ['text/csv', '.csv'],
]);
async function authorize(req, res, next) {
  const match = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: { message: 'Bearer token required' } });
  try {
    req.auth = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: process.env.JWT_ISSUER || 'platform-iam', audience: process.env.JWT_AUDIENCE || 'platform-applications' });
    await require('./subscription-access')(req);
    const organizationId = req.params.organizationId || req.query.organizationId;
    const factoryId = req.params.factoryId || req.query.factoryId;
    if (![organizationId, factoryId].every((value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value))) return res.status(422).json({ error: { message: 'Organization and factory IDs are required' } });
    const permissions = req.auth.permissions || [];
    if (!permissions.includes('*') && !permissions.includes(req.method === 'POST' ? 'MMMS-FILES-CREATE' : 'MMMS-FILES-VIEW')) return res.status(403).json({ error: { message: 'MMMS file permission required' } });
    const scopes = req.auth.accessScopes || [];
    if (!permissions.includes('*') && !scopes.some((scope) => scope.enabled !== false && ['MMMS', '*'].includes(String(scope.applicationName).toUpperCase()) && (!scope.organizationId || String(scope.organizationId) === organizationId) && (!scope.factoryId || String(scope.factoryId) === factoryId))) return res.status(403).json({ error: { message: 'File is outside your assigned scope' } });
    req.fileScope = { organizationId, factoryId };
    next();
  } catch (error) { res.status(error.status || 401).json({ error: { message: error.status ? error.message : 'Invalid or expired token' } }); }
}
const storage = multer.diskStorage({
  destination(req, file, callback) {
    const target = path.join(root, req.fileScope.organizationId, req.fileScope.factoryId);
    fs.mkdir(target, { recursive: true }).then(() => callback(null, target), callback);
  },
  filename(req, file, callback) { callback(null, randomUUID() + allowed.get(file.mimetype)); },
});
const upload = multer({ storage, limits: { fileSize: Number(process.env.MMMS_MAX_FILE_BYTES || 52428800), files: 10 }, fileFilter(req, file, callback) { if (!allowed.has(file.mimetype)) return callback(new Error('Unsupported attachment type')); callback(null, true); } });
router.post('/', authorize, (req, res) => {
  upload.array('files', 10)(req, res, async (error) => {
    if (error) return res.status(422).json({ error: { message: error.message } });
    if (!req.files?.length) return res.status(422).json({ error: { message: 'Choose at least one attachment' } });
    res.status(201).json({ result: req.files.map((file) => ({ id: file.filename, name: path.basename(file.originalname), mimeType: file.mimetype, size: file.size, organizationId: req.fileScope.organizationId, factoryId: req.fileScope.factoryId, url: `/api/ss/mmms/files/${req.fileScope.organizationId}/${req.fileScope.factoryId}/${file.filename}` })) });
  });
});
router.get('/:organizationId/:factoryId/:filename', authorize, (req, res) => {
  if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/.test(req.params.filename)) return res.status(404).end();
  const file = path.join(root, req.fileScope.organizationId, req.fileScope.factoryId, req.params.filename);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'private, no-store');
  res.download(file, req.params.filename, (error) => { if (error && !res.headersSent) res.status(404).json({ error: { message: 'Attachment not found' } }); });
});
module.exports = router;
