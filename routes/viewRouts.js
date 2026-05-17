const express = require('express');
const viewController = require('../controllers/viewController');

const router = express.Router();

module.exports = router;

router.get('/', viewController.getOverview);
router.get('/tour', viewController.getTour);
