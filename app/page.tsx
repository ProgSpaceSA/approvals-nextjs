import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getSession()

  if (!session) {
    redirect('/sign-in')
  }

  // Redirect based on role
  if (session.user.role === 'CEO') {
    redirect('/dashboard')
  } else {
    redirect('/my-requests')
  }
}
