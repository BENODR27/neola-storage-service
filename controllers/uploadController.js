const fs = require('fs');

// Function to create directories dynamically
const getUploadDir = (file, pjname) => {
    let uploadDir = `uploads/${pjname}/others`; // Default folder

    if (file.mimetype.startsWith('image/')) {
        uploadDir = `uploads/${pjname}/images`;
    } else if (file.mimetype.startsWith('video/')) {
        uploadDir = `uploads/${pjname}/videos`;
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('ms-excel')) {
        uploadDir = `uploads/${pjname}/documents/excel`;
    } else if (file.mimetype.includes('pdf')) {
        uploadDir = `uploads/${pjname}/documents/pdf`;
    } else if (file.mimetype.includes('wordprocessingml') || file.mimetype.includes('msword')) {
        uploadDir = `uploads/${pjname}/documents/word`;
    }

    fs.mkdirSync(uploadDir, { recursive: true }); // Ensure folder exists
    return uploadDir;
};

// Image Upload Handler
const uploadImages = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileNames = req.files.map(file => `${file.filename}`);

    res.json({
        message: 'Images uploaded successfully',
        fileUrls: fileNames
    });
};

// Video Upload Handler
const uploadVideo = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
        message: 'Video uploaded successfully',
        fileUrl: `${req.file.filename}`
    });
};

module.exports = { getUploadDir, uploadImages, uploadVideo };
