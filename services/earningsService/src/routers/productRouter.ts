import { Router } from 'express';
import {
	createProduct,
	deleteProduct,
	getProductById,
	listProducts,
	seedInitialProducts,
	updateProduct,
} from '../controllers/productController.js';

const productRouter = Router();

productRouter.get('/products', listProducts);
productRouter.get('/products/:id', getProductById);
productRouter.post('/products', createProduct);
productRouter.patch('/products/:id', updateProduct);
productRouter.delete('/products/:id', deleteProduct);
productRouter.post('/products/seed', seedInitialProducts);

export default productRouter;
