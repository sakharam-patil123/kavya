const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerRaw');
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Protected upload route - admin or instructor
router.post('/', protect, upload.single('file'), uploadFile);

module.exports = router;
