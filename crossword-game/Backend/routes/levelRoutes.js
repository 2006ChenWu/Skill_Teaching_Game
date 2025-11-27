const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');

// GET /api/levels - 获取所有关卡列表
router.get('/levels', levelController.getLevelsList);

// GET /api/level/:levelId - 获取单个关卡详情
router.get('/level/:levelId', levelController.getLevelDetail);

// POST /api/level/:levelId/verify - 验证答案
router.post('/level/:levelId/verify', levelController.verifyAnswer);

module.exports = router;