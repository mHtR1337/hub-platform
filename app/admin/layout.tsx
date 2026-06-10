import type * as React from 'react'
import { requireRole } from '@/lib/clerk'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole('admin')
  return <>{children}</>
}
