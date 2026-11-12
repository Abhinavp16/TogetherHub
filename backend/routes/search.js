const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.use(auth);

router.get('/', searchController.search);

module.exports = router;
