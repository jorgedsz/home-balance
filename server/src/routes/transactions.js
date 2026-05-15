const express = require('express');
const router = express.Router();
const c = require('../controllers/transactionController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', c.listTransactions);
router.post('/', c.createTransaction);
router.patch('/:id', c.updateTransaction);
router.post('/:id/toggle-paid', c.togglePaid);
router.delete('/:id', c.deleteTransaction);

module.exports = router;
