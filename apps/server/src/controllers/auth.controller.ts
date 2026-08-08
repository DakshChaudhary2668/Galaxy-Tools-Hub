import { Request, Response, NextFunction } from 'express';
import { BaseRepository } from '../repositories/base.repository';
import { ProfileDto, AdminUserDto } from '@galaxy/types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/app-error';

const profileRepository = new BaseRepository<ProfileDto>('profiles');
const adminUserRepository = new BaseRepository<AdminUserDto>('admin_users');

export async function getCustomerMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.customer) {
      return next(new AppError('Unauthorized: Customer session missing', 401));
    }
    const profile = await profileRepository.findById(req.customer.id);
    sendSuccess(res, profile || req.customer, 'Customer profile retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getAdminMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized: Admin session missing', 401));
    }
    const adminUser = await adminUserRepository.findById(req.user.id);
    sendSuccess(res, adminUser || req.user, 'Admin details retrieved successfully');
  } catch (error) {
    next(error);
  }
}
