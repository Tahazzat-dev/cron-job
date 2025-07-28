import {Router} from 'express';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';
import { addPackageController, deletePackageController, getAllPackagesController, getSinglePackageController, updatePackageController } from '../controllers/packageController';
const router = Router();

// packages api for admin
router.post('/admin/packages',isAdminMiddleware, addPackageController);
router.get('/admin/packages',isAdminMiddleware, getAllPackagesController);
router.get('/admin/packages/:packageId',isAdminMiddleware, getSinglePackageController);
router.put('/admin/packages/:packageId',isAdminMiddleware, updatePackageController);
router.delete('/admin/packages/:packageId',isAdminMiddleware, deletePackageController);

// packages api for user

export default router; 
