import { Router } from 'express';
import * as productsController from '../controllers/products.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', productsController.listProducts);
router.get('/categories', productsController.listCategories);
router.get('/:slug', productsController.getProductBySlug);

// Admin-only: trigger a Premium Collection sync.
router.post('/admin/sync', requireAuth, requireRole('ADMIN'), productsController.syncFromCjDropshipping);
router.get('/admin/cj/:cjProductId', requireAuth, requireRole('ADMIN'), productsController.getProductDetailPreview);

export default router;
