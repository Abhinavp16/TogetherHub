const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

router.get('/:id', documentController.getSharedWhiteboardDocument);
router.patch('/:id', documentController.updateSharedWhiteboardDocument);

module.exports = router;
