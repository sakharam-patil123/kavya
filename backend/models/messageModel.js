const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  attachments: [{
    name: String,
    type: String,
    data: String, // Base64 encoded file data
    size: Number
  }],
  read: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Track which users have deleted this message
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
