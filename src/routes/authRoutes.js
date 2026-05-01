const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/login', AuthController.login);
router.get('/health', AuthController.healthCheck);

module.exports = router;
