import { Router } from 'express';
const router = Router();
import { addDomainController, profileUpdateController, removeDomainController, subscribePackageController, updateDomainStatusController, viewProfileController } from '../controllers/userController';
import { clearUserCronHistoryController, getTransactionHistoryController, getUserCronHistoryController } from '../controllers/logsController';

// domain 
router.put('/domain/status', updateDomainStatusController);
router.post('/domain', addDomainController);
router.delete('/domain', removeDomainController);

// profile
router.put('/profile', profileUpdateController);
router.get('/profile', viewProfileController);

// logs
router.get('/cron-log', getUserCronHistoryController);
router.delete('/cron-log', clearUserCronHistoryController);

// transactions
router.get('/transactions', getTransactionHistoryController);

// subscription 
router.get('/subscribe-package', subscribePackageController);
 

export default router;
