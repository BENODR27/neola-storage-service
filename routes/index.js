
const express = require('express');
const router = express.Router();
router.use('/mmms/files', require('./MmmsFilesRouter'));

if (process.env.STORAGE_MMMS_ONLY !== 'true') {
  router.use('/upload', require('./UploadRouter'));
}

module.exports = router;
