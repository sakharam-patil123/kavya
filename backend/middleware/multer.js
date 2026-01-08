const multer = require('multer');

// Configure multer to use memory storage (buffer)
const storage = multer.memoryStorage();

// Image-only middleware (used for profile photos and image uploads)
const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File middleware for PDFs and Word documents (and images)
const documentFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if ((file.mimetype && file.mimetype.startsWith('image/')) || allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image, PDF, or Word documents are allowed!'), false);
  }
};

const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const uploadFiles = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFilter,
});

module.exports = { upload: uploadImages, uploadFiles };

