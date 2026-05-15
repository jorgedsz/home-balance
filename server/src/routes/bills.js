const express = require('express');
const router = express.Router();
const c = require('../controllers/billController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', c.listBills);
router.post('/', c.createBill);
router.patch('/:id', c.updateBill);
router.delete('/:id', c.deleteBill);

module.exports = router;
