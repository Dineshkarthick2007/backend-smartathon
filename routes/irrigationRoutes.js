const express = require('express');
const router = express.Router();
const irrigationController = require('../controllers/irrigationController');

// Define API routes
router.get('/state/:fieldId', irrigationController.getRecommendation);
router.get('/fields', irrigationController.getAllFields);
router.post('/field', irrigationController.addField);
router.post('/seed', irrigationController.seedCrops);

module.exports = router;
