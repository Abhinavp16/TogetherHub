const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/:id', documentController.getSharedCodeDocument);
router.patch('/:id', documentController.updateSharedCodeDocument);

module.exports = router;
