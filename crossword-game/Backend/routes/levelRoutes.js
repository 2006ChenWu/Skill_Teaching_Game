const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');


router.get('/levels', levelController.getLevelsList);

router.get('/level/:levelId', levelController.getLevelDetail);


router.post('/level/:levelId/verify', levelController.verifyAnswer);

module.exports = router;