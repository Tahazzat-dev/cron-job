import {Router} from 'express';
const router = Router();
import {registerController} from "../controllers/authController"

router.post('/register', registerController);
// router.post('/login', login);
// router.post('/refresh-token', refreshToken);
// router.post('/logout', logout);

export default router;
