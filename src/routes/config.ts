import {Router} from 'express';
const router = Router();
const { registerController, loginController, refreshTokenController, logoutController } = require('../controllers/authController');

router.post('/register', registerController);
// router.post('/login', login);
// router.post('/refresh-token', refreshToken);
// router.post('/logout', logout);

export default router;
