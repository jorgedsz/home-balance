const express = require('express');
const router = express.Router();
const c = require('../controllers/overviewController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', c.getOverview);

module.exports = router;
