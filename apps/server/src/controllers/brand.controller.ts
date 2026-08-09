import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { BrandDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const brandRepository = new BaseRepository<BrandDto>('brands');

export async function getBrands(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const brands = await brandRepository.list(100);
    sendSuccess(res, { data: brands, message: 'Brands retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getBrandBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const brand = await brandRepository.findBySlug(req.params.slug);
    if (!brand) {
      return next(new AppError('Brand not found', 404));
    }
    sendSuccess(res, { data: brand, message: 'Brand details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newBrand = await brandRepository.create(req.body);
    sendSuccess(res, { data: newBrand, message: 'Brand created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedBrand = await brandRepository.update(req.params.id, req.body);
    sendSuccess(res, { data: updatedBrand, message: 'Brand updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await brandRepository.delete(req.params.id);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
}
