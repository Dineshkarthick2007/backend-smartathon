const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

router.post('/recommend-crops', cropController.recommendCrops);
router.post('/add-crop', cropController.addCrop);
router.get('/crop-progress/:cropId', cropController.getCropProgress);
router.delete('/crop-instance/:cropId', cropController.deleteCropInstance);

module.exports = router;
