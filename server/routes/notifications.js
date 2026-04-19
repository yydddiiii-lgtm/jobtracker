const router = require('express').Router();
const ctrl = require('../controllers/notificationController');

router.get('/', ctrl.list);
router.patch('/read-all', ctrl.markAllRead);  // must precede /:id/read
router.patch('/:id/read', ctrl.markRead);

module.exports = router;
