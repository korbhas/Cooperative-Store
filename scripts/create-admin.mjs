/**
 * One-time script to create an admin user in Supabase.
 * Usage: node scripts/create-admin.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const EMAIL = 'admin@freshmart.com'
const PASSWORD = 'Admin@1234'
const NAME = 'Admin'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing env vars.')
  console.error('    Add SUPABASE_SERVICE_ROLE_KEY to your .env file.')
  console.error('    Get it from: Supabase Dashboard → Settings → API → service_role key\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { name: NAME, role: 'admin' },
})

if (error) {
  if (error.message?.includes('already registered')) {
    console.log('\n⚠️  User already exists. Updating role to admin…')
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find(u => u.email === EMAIL)
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, role: 'admin' },
      })
      console.log('✅  Admin role set on existing user.\n')
    }
  } else {
    console.error('\n❌  Error:', error.message, '\n')
    process.exit(1)
  }
} else {
  console.log('\n✅  Admin account created!')
  console.log(`    Email:    ${EMAIL}`)
  console.log(`    Password: ${PASSWORD}`)
  console.log(`    Login at: http://localhost:3000/admin/login\n`)
}
