const router = require('express').Router();
const ctrl = require('../controllers/offerController');

router.get('/', ctrl.list);
router.patch('/:id', ctrl.update);

module.exports = router;
