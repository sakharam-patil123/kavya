const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Course = require('../models/courseModel');
const User = require('../models/userModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');

// GET /api/search?q=keyword
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Query required', results: [] });

    // Escape regex special chars to avoid injection
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safe, 'i');

    // Run queries in parallel
    const [courses, users, lessons, quizzes] = await Promise.all([
      Course.find({ $or: [{ title: regex }, { description: regex }, { category: regex }] }).limit(10).lean(),
      User.find({ $or: [{ fullName: regex }, { email: regex }] }).limit(10).select('fullName email avatar role').lean(),
      Lesson.find({ $or: [{ title: regex }, { description: regex }, { content: regex }] }).limit(10).lean(),
      Quiz.find({ title: regex }).limit(10).lean(),
    ]);

    const results = [];

    courses.forEach(c => results.push({
      type: 'course',
      id: c._id,
      title: c.title,
      snippet: c.description ? (c.description.substring(0, 200) + (c.description.length > 200 ? '...' : '')) : '',
      route: `/courses?id=${c._id}`,
      meta: { category: c.category || null }
    }));

    users.forEach(u => results.push({
      type: 'user',
      id: u._id,
      title: u.fullName || u.email,
      snippet: u.email || '',
      route: `/profile`,
      meta: { userId: u._id, role: u.role }
    }));

    lessons.forEach(l => results.push({
      type: 'lesson',
      id: l._id,
      title: l.title,
      snippet: l.description ? (l.description.substring(0, 200) + (l.description.length > 200 ? '...' : '')) : '',
      route: `/student/courses/${l.course}`,
      meta: { lessonId: l._id, courseId: l.course }
    }));

    quizzes.forEach(qz => results.push({
      type: 'quiz',
      id: qz._id,
      title: qz.title,
      snippet: '',
      route: `/student/courses/${qz.course}`,
      meta: { quizId: qz._id, courseId: qz.course }
    }));

    return res.json({ success: true, query: q, count: results.length, results });
  } catch (err) {
    next(err);
  }
});

// Helper to escape regex special chars
const escapeRegex = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/search - accepts long-form bodies for large/multi-sentence searches
router.post('/', async (req, res, next) => {
  try {
    const qRaw = (req.body && req.body.q) ? String(req.body.q).trim() : '';
    if (!qRaw) return res.status(400).json({ success: false, message: 'Query required', results: [] });

    // Split into sentences and limit to 100 sentences
    const sentences = qRaw.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
    const limitedText = sentences.slice(0, 100).join(' ');

    // Tokenize and keep a safe number of tokens for regex
    const tokens = Array.from(new Set(limitedText.split(/[^A-Za-z0-9_]+/).map(t => t.toLowerCase()).filter(t => t && t.length >= 2))).slice(0, 200);

    if (tokens.length === 0) return res.json({ success: true, query: qRaw, count: 0, results: [] });

    const tokenRegex = new RegExp(tokens.map(escapeRegex).join('|'), 'i');

    // Run queries in parallel with larger limits
    const [courses, users, lessons, quizzes] = await Promise.all([
      Course.find({ $or: [{ title: tokenRegex }, { description: tokenRegex }, { category: tokenRegex }] }).limit(50).lean(),
      User.find({ $or: [{ fullName: tokenRegex }, { email: tokenRegex }] }).limit(50).select('fullName email avatar role').lean(),
      Lesson.find({ $or: [{ title: tokenRegex }, { description: tokenRegex }, { content: tokenRegex }] }).limit(50).lean(),
      Quiz.find({ title: tokenRegex }).limit(50).lean(),
    ]);

    const results = [];

    courses.forEach(c => results.push({
      type: 'course',
      id: c._id,
      title: c.title,
      snippet: c.description ? (c.description.substring(0, 200) + (c.description.length > 200 ? '...' : '')) : '',
      route: `/courses?id=${c._id}`,
      meta: { category: c.category || null }
    }));

    users.forEach(u => results.push({
      type: 'user',
      id: u._id,
      title: u.fullName || u.email,
      snippet: u.email || '',
      route: `/profile`,
      meta: { userId: u._id, role: u.role }
    }));

    lessons.forEach(l => results.push({
      type: 'lesson',
      id: l._id,
      title: l.title,
      snippet: l.description ? (l.description.substring(0, 200) + (l.description.length > 200 ? '...' : '')) : '',
      route: `/student/courses/${l.course}`,
      meta: { lessonId: l._id, courseId: l.course }
    }));

    quizzes.forEach(qz => results.push({
      type: 'quiz',
      id: qz._id,
      title: qz.title,
      snippet: '',
      route: `/student/courses/${qz.course}`,
      meta: { quizId: qz._id, courseId: qz.course }
    }));

    return res.json({ success: true, query: qRaw, count: results.length, results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
