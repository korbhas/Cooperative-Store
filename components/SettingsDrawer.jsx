'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { IconLogout, IconUser } from '@tabler/icons-react'
import { useUser, useClerk } from '@clerk/nextjs'
import AddressForm from '@/components/checkout/AddressForm'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

// Left-side customer settings drawer. Controlled by the Navbar so menu items
// can open it: <SettingsDrawer open={open} onOpenChange={setOpen} />
export default function SettingsDrawer({ open, onOpenChange }) {
  const router = useRouter()
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()

  const displayName = user?.fullName || user?.firstName || 'User'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  function handleManageAccount() {
    // Clerk's profile modal fights the drawer's focus trap — close first.
    onOpenChange(false)
    openUserProfile()
  }

  async function handleSignOut() {
    onOpenChange(false)
    await signOut()
    router.push('/')
  }

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Manage your account and delivery preferences.</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Account */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar className="size-10">
              <AvatarImage src={user?.imageUrl} alt={displayName} />
              <AvatarFallback>
                <IconUser className="size-4 opacity-60" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageAccount}>
              Manage
            </Button>
          </div>

          {/* Default delivery details */}
          <div>
            <h4 className="text-sm font-semibold">Default Delivery Details</h4>
            <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
              Saved on this device and used to prefill checkout.
            </p>
            <AddressForm
              formId="settings-address-form"
              onSubmitted={() => toast.success('Delivery details saved')}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button type="submit" form="settings-address-form" className="w-full">
            Save Delivery Details
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <IconLogout className="size-4" /> Sign out
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
