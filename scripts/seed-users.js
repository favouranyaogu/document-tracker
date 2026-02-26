/**
 * Seed script: creates 1 Admin + 2 Staff users in Supabase Auth and profiles.
 * Run once after creating your Supabase project and running schema.sql.
 *
 * Usage: npm run seed
 * Requires: .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const SEED_USERS = [
  { email: 'admin@office.local', password: 'AdminChangeMe1', name: 'Office Admin', role: 'admin' },
  { email: 'staff1@office.local', password: 'StaffChangeMe1', name: 'Staff One', role: 'staff' },
  { email: 'staff2@office.local', password: 'StaffChangeMe1', name: 'Staff Two', role: 'staff' }
]

async function seed() {
  console.log('Creating seed users...')

  for (const u of SEED_USERS) {
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role }
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  Skip ${u.email} (already exists)`)
        continue
      }
      console.error(`  Failed ${u.email}:`, authError.message)
      continue
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.user.id,
      email: u.email,
      name: u.name,
      role: u.role
    }, { onConflict: 'id' })

    if (profileError) {
      console.error(`  Profile failed for ${u.email}:`, profileError.message)
      continue
    }

    console.log(`  Created ${u.email} (${u.role})`)
  }

  console.log('Done. Default passwords: AdminChangeMe1 / StaffChangeMe1 — change after first login.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
