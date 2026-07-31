const express = require('express');
const { getDoctors, getDoctorById } = require('../controllers/doctorController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getDoctors);
router.get('/:id', authenticateToken, getDoctorById);

module.exports = router;