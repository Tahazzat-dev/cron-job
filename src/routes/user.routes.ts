import {Router} from 'express';
const router = Router();
import { addDomainController, profileUpdateController, removeDomainController, updateDomainStatusController, viewProfileController } from '../controllers/userController';

router.put('/domain/status', updateDomainStatusController);
router.post('/domain', addDomainController);
router.delete('/domain', removeDomainController);
router.put('/profile', profileUpdateController);
router.get('/profile', viewProfileController);

export default router;
