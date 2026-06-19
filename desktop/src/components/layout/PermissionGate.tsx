import type { PropsWithChildren } from 'react'
import { useAuthStore } from '../../features/auth/authStore'
import { hasPermission, type Permission } from '../../lib/permissions'

export function PermissionGate({ permission, children }: PropsWithChildren<{ permission: Permission }>) {
  const { user } = useAuthStore()
  return hasPermission(user?.tipo, permission) ? children : null
}
