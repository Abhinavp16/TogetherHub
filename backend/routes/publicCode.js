const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { optionalAuth } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.param('id', validateObjectId);
router.use(optionalAuth);

router.get('/:id', documentController.getSharedCodeDocument);
router.patch('/:id', documentController.updateSharedCodeDocument);

module.exports = router;
