const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Authenticated Routes
router.use(authenticateToken);

router.post('/:id/messages', sendMessage);
router.get('/:id/messages', getMessages);

module.exports = router;