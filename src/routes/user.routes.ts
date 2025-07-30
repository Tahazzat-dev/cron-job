import { Router } from 'express';
const router = Router();
import { addDomainController, profileUpdateController, removeDomainController, updateDomainStatusController, viewProfileController } from '../controllers/userController';
import { clearUserCronHistoryController, getUserCronHistoryController } from '../controllers/logsController';

router.put('/domain/status', updateDomainStatusController);
router.post('/domain', addDomainController);
router.delete('/domain', removeDomainController);
router.put('/profile', profileUpdateController);
router.get('/profile', viewProfileController);
router.get('/cron-log', getUserCronHistoryController);
router.delete('/cron-log', clearUserCronHistoryController);

export default router;
