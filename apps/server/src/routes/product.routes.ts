import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/product.controller';

export const productRouter: Router = Router();

productRouter.get('/', getProducts);
productRouter.get('/:id', getProductById);
