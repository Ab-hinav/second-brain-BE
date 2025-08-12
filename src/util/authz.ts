import { AppError } from './appError';

export function assertOwner(userId: string, ownerId: string) {
  if (userId !== ownerId) {
    throw AppError.forbidden('NOT_OWNER', 'User is not the owner of this resource');
  }
}