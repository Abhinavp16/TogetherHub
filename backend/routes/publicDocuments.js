const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/:id', documentController.getSharedDocument);
router.patch('/:id', documentController.updateSharedDocument);

module.exports = router;
