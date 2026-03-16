const express = require('express');
const router = express.Router();
const fertilizerController = require('../controllers/fertilizerController');

// Get recommendation for a specific user crop instance
router.get('/recommendation/:cropId', fertilizerController.getFertilizerRecommendation);

// Get all fertilizer data (debugging/admin)
router.get('/data', fertilizerController.getAllFertilizerData);

module.exports = router;
