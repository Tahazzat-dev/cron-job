import { Router } from 'express';
import { addManualCronController, dashboardInfoCronController, deleteManualCronController, getManualCronsController, getSingleUserController, getUsersDetailsController, updateManualCronController, updateUserController } from '../controllers/adminControllers';
import { clearAllTransactionHistoryController, clearCronHistoryController, getAdminCronHistoryController, getAllTransactionHistoryController } from '../controllers/logsController';
const router = Router();

// cron log routes
router.get('/cron-log', getAdminCronHistoryController);
router.delete('/cron-log', clearCronHistoryController);

// transaction history route 
router.get('/transaction-history', getAllTransactionHistoryController);
router.delete('/transaction-history', clearAllTransactionHistoryController);

// users route
router.put('/users/:id', updateUserController);
router.get('/users/:id', getSingleUserController);
router.get('/users', getUsersDetailsController);

// manual crons
router.post('/crons', addManualCronController)
router.delete('/crons/:domainId', deleteManualCronController)
router.get('/crons', getManualCronsController)
router.put('/crons/:domainId', updateManualCronController)

// dashboard
router.get('/dashboard-info', dashboardInfoCronController)

export default router;
