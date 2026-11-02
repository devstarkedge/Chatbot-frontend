const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Django RAG API Base URL
const DJANGO_API_BASE = (
  process.env.DJANGO_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');

// @route   POST /api/chat/ask
// @desc    Send question to Django RAG API with userId, role, and email in payload
// @access  Private (JWT protected)
router.post('/ask', protect, async (req, res) => {
  try {
    const { question, session_id, top_k, hops, collections, edit_index } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    // Identity comes from the authenticated account, never from client-supplied fields.
    const userId = req.user?._id
      ? req.user._id.toString()
      : String(req.user?.id || '');
    const userEmail = req.user?.email || '';
    const userRole = req.user?.role || 'user';

    // Build payload sent directly to Django API (including userId, role, email)
    const payload = {
      question: question.trim(),
      ...(session_id ? { session_id } : {}),
      ...(top_k ? { top_k: Number(top_k) } : {}),
      ...(hops !== undefined ? { hops: Number(hops) } : {}),
      ...(collections && Array.isArray(collections) ? { collections } : {}),
      ...(edit_index !== undefined ? { edit_index: Number(edit_index) } : {}),
      // User identity fields sent directly with API payload to Django
     
      user_id: userId,
      role: userRole,
      email: userEmail,
    };

    console.log(`[POST /api/chat/ask -> Django] User: ${userId} (${userEmail}, ${userRole}) - Question: "${question.trim()}"`);

    const djangoRes = await fetch(`${DJANGO_API_BASE}/ask/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await djangoRes.json().catch(() => ({}));

    if (!djangoRes.ok) {
      return res.status(djangoRes.status).json({
        error: data.error || `Django API Error (HTTP ${djangoRes.status})`,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat /ask error in backend:', error);
    return res.status(502).json({
      error: 'Chatbot service unreachable. Please ensure the Django AI backend is running.',
    });
  }
});

// @route   GET /api/chat/chats
// @desc    Get conversation sessions from Django RAG API
// @access  Private (JWT protected)
router.get('/chats', protect, async (req, res) => {
  try {
    const djangoRes = await fetch(`${DJANGO_API_BASE}/chats/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
    });

    const data = await djangoRes.json().catch(() => ({ sessions: [] }));
    if (!djangoRes.ok) {
      return res.status(djangoRes.status).json({
        error: data.error || `Failed to fetch chats (HTTP ${djangoRes.status})`,
        sessions: [],
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat /chats error in backend:', error);
    return res.status(502).json({
      error: 'Could not load chat history from AI backend.',
      sessions: [],
    });
  }
});

// @route   GET /api/chat/chats/:sessionId
// @desc    Get details and messages of a specific conversation session
// @access  Private (JWT protected)
router.get('/chats/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const djangoRes = await fetch(
      `${DJANGO_API_BASE}/chats/${encodeURIComponent(sessionId)}/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
      }
    );

    const data = await djangoRes.json().catch(() => ({}));
    if (!djangoRes.ok) {
      return res.status(djangoRes.status).json({
        error: data.error || `Failed to fetch conversation (HTTP ${djangoRes.status})`,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat /chats/:sessionId error in backend:', error);
    return res.status(502).json({
      error: 'Could not load conversation messages from AI backend.',
    });
  }
});

// @route   POST /api/chat/chats/:sessionId/rename
// @desc    Rename a chat session
// @access  Private (JWT protected)
router.post('/chats/:sessionId/rename', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const djangoRes = await fetch(
      `${DJANGO_API_BASE}/chats/${encodeURIComponent(sessionId)}/rename/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
        body: JSON.stringify({ title: title.trim() }),
      }
    );

    const data = await djangoRes.json().catch(() => ({}));
    if (!djangoRes.ok) {
      return res.status(djangoRes.status).json({
        error: data.error || 'Failed to rename chat.',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat rename error in backend:', error);
    return res.status(502).json({ error: 'Failed to rename chat on backend.' });
  }
});

// @route   DELETE /api/chat/chats/:sessionId/delete
// @desc    Delete a chat session
// @access  Private (JWT protected)
router.delete('/chats/:sessionId/delete', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const djangoRes = await fetch(
      `${DJANGO_API_BASE}/chats/${encodeURIComponent(sessionId)}/delete/`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        },
      }
    );

    const data = await djangoRes.json().catch(() => ({ success: true }));
    if (!djangoRes.ok) {
      return res.status(djangoRes.status).json({
        error: data.error || 'Failed to delete chat.',
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat delete error in backend:', error);
    return res.status(502).json({ error: 'Failed to delete chat on backend.' });
  }
});

// @route   GET /api/chat/health
// @desc    Check AI backend health status
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const djangoRes = await fetch(`${DJANGO_API_BASE}/health/`);
    const data = await djangoRes.json().catch(() => ({}));
    return res.status(djangoRes.ok ? 200 : 503).json({
      status: djangoRes.ok ? 'healthy' : 'unhealthy',
      djangoStatus: djangoRes.status,
      djangoData: data,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unreachable',
      error: error.message,
    });
  }
});

module.exports = router;
