const router = require('express').Router();
const ctrl = require('../controllers/statsController');

router.get('/overview', ctrl.overview);

module.exports = router;
