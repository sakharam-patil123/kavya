const jwt = require('jsonwebtoken');
const { getIo } = require('./io');

// Socket handler: clients must authenticate by emitting an `auth` event with their JWT
module.exports = function setupMessageSocket(io) {
  io.on('connection', (socket) => {
    socket.userId = null;

    socket.on('auth', (token) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
        socket.userId = decoded.id;
        // Join a personal room for the user id
        socket.join(`user:${socket.userId}`);
        socket.emit('authenticated', { ok: true });
      } catch (err) {
        console.warn('Socket auth failed', err?.message || err);
        socket.emit('authenticated', { ok: false });
      }
    });

    socket.on('send_message', (payload) => {
      // payload: { to, text }
      const from = socket.userId;
      if (!from) return socket.emit('error', { message: 'Not authenticated' });
      const to = payload && payload.to;
      const text = payload && payload.text;
      // forward to recipient room immediately (backend will persist via REST POST)
      if (to) {
        io.to(`user:${to}`).emit('new_message', { from, to, text, createdAt: new Date().toISOString() });
      }
    });

    socket.on('disconnect', () => {
      // cleanup happens automatically
    });
  });
};
