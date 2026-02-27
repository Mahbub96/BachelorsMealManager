const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const { validateObjectId } = require('../middleware/validation');
const groupAdminController = require('../controllers/groupAdminController');
const groupElectionController = require('../controllers/groupElectionController');

// Static route first so "current" is not matched as :id
router.get(
  '/change-requests/current',
  protect,
  groupAdminController.getCurrentChangeRequest
);

router.post(
  '/change-requests/current/cancel',
  protect,
  groupAdminController.cancelChangeRequest
);

router.get(
  '/members',
  protect,
  groupAdminController.getGroupMembers
);

router.post(
  '/change-requests',
  protect,
  groupAdminController.createChangeRequest
);

router.post(
  '/change-requests/:id/vote',
  protect,
  validateObjectId,
  groupAdminController.voteOnChangeRequest
);

// Election flow: admin arranges → members apply as candidates → admin starts → members vote
router.get(
  '/elections/current',
  protect,
  groupElectionController.getCurrentElection
);
router.post(
  '/elections',
  protect,
  groupElectionController.createElection
);
router.post(
  '/elections/current/apply',
  protect,
  groupElectionController.applyAsCandidate
);
router.post(
  '/elections/current/start',
  protect,
  groupElectionController.startElection
);
router.post(
  '/elections/current/vote',
  protect,
  groupElectionController.vote
);
router.post(
  '/elections/current/cancel',
  protect,
  groupElectionController.cancelElection
);

module.exports = router;

