import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { VendorDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';
import { supabaseAdmin } from '../config/supabase';

const vendorRepository = new BaseRepository<VendorDto>('vendors');

export async function getVendors(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: vendors, error } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    sendSuccess(res, { data: vendors, message: 'Vendors retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getVendorById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!vendor) {
      return next(new AppError('Vendor not found', 404));
    }
    sendSuccess(res, { data: vendor, message: 'Vendor details retrieved successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newVendor = await vendorRepository.create(req.body);
    sendSuccess(res, { data: newVendor, message: 'Vendor created successfully', statusCode: 201 });
  } catch (error) {
    next(error);
  }
}

export async function updateVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updatedVendor = await vendorRepository.update(req.params.id, req.body);
    sendSuccess(res, { data: updatedVendor, message: 'Vendor updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await vendorRepository.delete(req.params.id);
    sendSuccess(res, { data: { id: req.params.id }, message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
}
