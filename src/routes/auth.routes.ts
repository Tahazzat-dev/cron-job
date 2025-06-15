import {Router} from 'express';
const router = Router();
import {registerController,loginController, refreshTokenController, logoutController} from "../controllers/authController"

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh-token',  refreshTokenController);
router.post('/logout', logoutController);

export default router;
