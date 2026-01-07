const { uploadToCloudinary } = require('../config/cloudinary');

// Upload a single file (PDF/doc) and return URL
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded' });

    const options = { resource_type: 'raw' }; // store as raw to preserve original file
    const result = await uploadToCloudinary(req.file.buffer, options);

    res.json({ url: result.secure_url || result.url, public_id: result.public_id, original_filename: result.original_filename });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};
