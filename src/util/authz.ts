export function assertOwner(userId: string, ownerId: string) {
  if (userId !== ownerId) throw new Error('Forbidden');
}