const router = require('express').Router();
const ctrl = require('../controllers/interviewController');

router.get('/', ctrl.listAll);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
