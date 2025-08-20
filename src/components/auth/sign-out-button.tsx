'use client'

import { signOut } from 'next-auth/react'
import { Button } from '../ui/button'

export default function SignOutButton() {
  const handleSignOut = async () => {
    // Sign out from NextAuth
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true,
    })
  }

  return <Button onClick={handleSignOut}>Sign Out</Button>
}
