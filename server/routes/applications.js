const router = require('express').Router();
const appCtrl = require('../controllers/applicationController');
const interviewCtrl = require('../controllers/interviewController');
const documentCtrl = require('../controllers/documentController');
const offerCtrl = require('../controllers/offerController');

router.get('/', appCtrl.list);
router.post('/', appCtrl.create);
router.get('/:id', appCtrl.getById);
router.patch('/:id', appCtrl.update);
router.delete('/:id', appCtrl.remove);

router.get('/:id/interviews', interviewCtrl.list);
router.post('/:id/interviews', interviewCtrl.create);

router.get('/:id/documents', documentCtrl.list);
router.post('/:id/documents', documentCtrl.create);

router.post('/:id/offer', offerCtrl.create);
router.patch('/:id/offer', offerCtrl.updateByApplication);
router.get('/:id/stage-logs', appCtrl.getStageLogs);

module.exports = router;
