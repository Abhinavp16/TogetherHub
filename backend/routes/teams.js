const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const teamController = require('../controllers/teamController');

router.param('id', validateObjectId);
router.param('userId', validateObjectId);
router.use(auth);

router.get('/', teamController.getTeams);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeam);
router.post('/:id/members', teamController.addTeamMember);
router.patch('/:id/members/:userId', teamController.updateTeamMember);
router.delete('/:id/members/:userId', teamController.removeTeamMember);

module.exports = router;
