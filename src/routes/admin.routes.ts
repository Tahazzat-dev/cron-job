import {Router} from 'express';
import { clearCronHistoryController, getCronHistoryController, getSingleUserController, getUsersDetailsController, updateUserController } from '../controllers/adminControllers';
const router = Router();

// cron log routes
router.get('/cron-log', getCronHistoryController);
router.delete('/cron-log', clearCronHistoryController);

// users route
router.put('/users/:id', updateUserController);
router.get('/users/:id', getSingleUserController);
router.get('/users', getUsersDetailsController);

// router.post('/refresh-token', refreshToken);
// router.post('/logout', logout);

export default router;
