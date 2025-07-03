// src/app/user/layout.tsx
import NavbarUser from '@/components/NavbarUser'
import React from 'react'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavbarUser />
      <main>{children}</main>
    </div>
  )
}
