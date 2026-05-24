import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminShell from '../_components/AdminShell'

export default async function AdminProtectedLayout({ children }) {
  const { userId } = await auth()
  if (!userId) redirect('/admin/login')

  const user = await currentUser()
  if (user?.publicMetadata?.role !== 'admin') redirect('/')

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const displayName = fullName || email
  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <AdminShell displayName={displayName} email={email} initials={initials}>
      {children}
    </AdminShell>
  )
}
