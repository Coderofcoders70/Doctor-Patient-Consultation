const express = require('express');

const { 
  createConsultation, 
  getConsultations, 
  getConsultationById, 
  updateConsultationStatus 
} = require('../controllers/consultationController');

const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Authenticated Routes
router.use(authenticateToken); 

router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);
router.patch('/:id/status', updateConsultationStatus);

module.exports = router;