export type Permission =
  | 'dashboard:view'
  | 'users:manage'
  | 'projects:manage'
  | 'documents:review'
  | 'reports:view'
  | 'audit:view'
  | 'settings:manage'

const adminPermissions: Permission[] = [
  'dashboard:view',
  'users:manage',
  'projects:manage',
  'documents:review',
  'reports:view',
  'audit:view',
  'settings:manage',
]

export const hasPermission = (tipo: string | undefined, permission: Permission) =>
  tipo === 'ADMIN' && adminPermissions.includes(permission)
