const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', roomController.createRoom);
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);
router.post('/:id/join', roomController.joinRoom);
router.post('/:id/leave', roomController.leaveRoom);

module.exports = router;
