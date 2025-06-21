import {Router} from 'express';
import { changeStatusController } from '../controllers/configController';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';
const router = Router();

router.post('/status',isAdminMiddleware, changeStatusController);
// router.post('/login', login);
// router.post('/refresh-token', refreshToken);
// router.post('/logout', logout);

export default router;
