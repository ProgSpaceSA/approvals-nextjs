'use client'

import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/sign-in' })
  }

  const getDashboardLink = () => {
    return session.user.role === 'CEO' ? '/dashboard' : '/my-requests'
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link 
            href={getDashboardLink()} 
            className="text-xl font-bold hover:text-primary transition-colors"
          >
            Approvals System
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{session.user.name}</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {session.user.role}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center space-x-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
