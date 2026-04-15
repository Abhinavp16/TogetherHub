const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/google/start', authController.startGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);
router.get('/github/start', authController.startGithubAuth);
router.get('/github/callback', authController.handleGithubCallback);
router.get('/me', auth, authController.getMe);

module.exports = router;
