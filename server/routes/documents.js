const router = require('express').Router();
const ctrl = require('../controllers/documentController');

router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
