import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { CategoryDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { supabaseAdmin } from '../config/supabase';

const categoryRepository = new BaseRepository<CategoryDto>('categories');

export interface CategoryWithCount extends CategoryDto {
  product_count: number;
}

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Fetch categories ordered by sort_order and name
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    // Fetch product counts per category
    const { data: productCounts, error: countErr } = await supabaseAdmin
      .from('products')
      .select('category_id');

    if (countErr) throw new Error(countErr.message);

    const countMap: Record<string, number> = {};
    (productCounts || []).forEach((p: { category_id?: string }) => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    const enriched = (categories || []).map((cat) => ({
      ...cat,
      product_count: countMap[cat.id] || 0
    }));

    sendSuccess(res, { data: enriched, message: 'Categories retrieved successfully' });
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
    const payload = req.body;
    if (!payload.name) {
      return next(new AppError('Category name is required', 400));
    }

    if (!payload.slug) {
      payload.slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Slug uniqueness
    const existing = await categoryRepository.findBySlug(payload.slug);
    if (existing) {
      return next(new AppError(`A category with slug "${payload.slug}" already exists.`, 400));
    }

    const newCategory = await categoryRepository.create(payload);
    sendSuccess(res, { data: newCategory, message: 'Category created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.params.id;
    const payload = req.body;

    // Prevent category from being its own parent
    if (payload.parent_id && payload.parent_id === categoryId) {
      return next(new AppError('A category cannot be its own parent category.', 400));
    }

    // Slug uniqueness check
    if (payload.slug) {
      const existing = await categoryRepository.findBySlug(payload.slug);
      if (existing && existing.id !== categoryId) {
        return next(new AppError(`Another category already uses slug "${payload.slug}".`, 400));
      }
    }

    const updatedCategory = await categoryRepository.update(categoryId, payload);
    sendSuccess(res, { data: updatedCategory, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.params.id;

    // Check if products depend on this category
    const { count, error: countErr } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (countErr) throw new Error(countErr.message);

    if (count && count > 0) {
      return next(
        new AppError(
          `Cannot delete category. ${count} product(s) are assigned to it. Please reassign or delete these products first, or deactivate the category.`,
          400
        )
      );
    }

    // Check if child categories exist
    const { count: childCount, error: childErr } = await supabaseAdmin
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', categoryId);

    if (childErr) throw new Error(childErr.message);

    if (childCount && childCount > 0) {
      return next(
        new AppError(
          `Cannot delete category. ${childCount} sub-category(ies) belong to it. Please reassign the sub-categories first.`,
          400
        )
      );
    }

    await categoryRepository.delete(categoryId);
    sendSuccess(res, { data: { id: categoryId }, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}
