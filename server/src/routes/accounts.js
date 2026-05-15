const express = require('express');
const router = express.Router();
const c = require('../controllers/accountController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', c.listAccounts);
router.post('/', c.createAccount);
router.patch('/:id', c.updateAccount);
router.delete('/:id', c.deleteAccount);

module.exports = router;
