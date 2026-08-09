import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { CategoryDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const categoryRepository = new BaseRepository<CategoryDto>('categories');

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoryRepository.list(100);
    sendSuccess(res, { data: categories, message: 'Categories retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoryRepository.findBySlug(req.params.slug);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
    sendSuccess(res, { data: category, message: 'Category details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newCategory = await categoryRepository.create(req.body);
    sendSuccess(res, { data: newCategory, message: 'Category created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedCategory = await categoryRepository.update(req.params.id, req.body);
    sendSuccess(res, { data: updatedCategory, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await categoryRepository.delete(req.params.id);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}
