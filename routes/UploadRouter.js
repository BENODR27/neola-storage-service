const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getUploadDir, uploadImages, uploadVideo } = require('../controllers/uploadController');

// Define dynamic storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const pjname = req.body.pjname || 'default_project'; // Extract pjname from request
        cb(null, getUploadDir(file, pjname));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Images Upload Route
router.post('/images', upload.array('images', 10), uploadImages);

// Video Upload Route
router.post('/video', upload.single('video'), uploadVideo);

module.exports = router;
