import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as productsController from '../controllers/products.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { productImageUpload } from '../middleware/upload';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/settings', adminController.getSettings);
router.post('/settings/markup', adminController.updateMarkup);
router.post('/settings/cj-rate', adminController.updateCjUsdToNgnRate);
router.get('/users', adminController.listUsers);
router.get('/sessions', adminController.listSessions);
router.patch('/users/:id/role', adminController.updateUserRole);
router.get('/audit-logs', adminController.listAuditLogs);
router.get('/coupons', adminController.listCoupons);
router.post('/coupons', adminController.createCoupon);
router.post('/products/sexual-wellness', productsController.createSexualWellnessProduct);
router.post('/products', productImageUpload.array('images', 6), productsController.createAdminProduct);
router.patch('/products/:id', productImageUpload.array('images', 6), productsController.updateAdminProduct);

export default router;

