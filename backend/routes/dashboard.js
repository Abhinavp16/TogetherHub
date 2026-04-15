const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(auth);

router.get('/summary', dashboardController.getSummary);

module.exports = router;
