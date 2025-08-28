import { Router } from 'express';
const router = Router();
import { addDomainController, initiateSubscribePackageController, profileUpdateController, removeDomainController, removeDomainsController, subscribePackageController, updateDomainStatusController, viewProfileController } from '../controllers/userController';
import { clearUserCronHistoryController, getTransactionHistoryController, getUserCronHistoryController } from '../controllers/logsController';

// domain 
router.put('/domain/status', updateDomainStatusController);
router.post('/domain', addDomainController);
router.delete('/domain', removeDomainsController);
router.delete('/domain/:domainId', removeDomainController);

// profile
router.put('/profile', profileUpdateController);
router.get('/profile', viewProfileController);

// logs
router.get('/cron-log', getUserCronHistoryController);
router.delete('/cron-log', clearUserCronHistoryController);

// transactions
router.get('/transactions', getTransactionHistoryController);

// subscription 
router.post('/initiate-subscribe-package', initiateSubscribePackageController);
router.post('/subscribe-package', subscribePackageController);
 

export default router;
