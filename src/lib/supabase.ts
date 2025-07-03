// src/lib/supabase.ts
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'


/**
 * 1) Define your row types
 */
export type UserProfile = {
  uid: string
  full_name: string
  username: string | null
  phone_number: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  cnic_number: string | null
  dob: string | null
  address: string | null
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
}

export type PaymentMethod = {
  id: string
  user_id: string
  type: string
  bank_name?: string
  account_number: string
  iban: string
  account_title: string
  created_at: string
}

export type UserSecurity = {
  user_id: string
  totp_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
  totp_factor_sid: string | null
  totp_secret: string | null
  totp_secret_encrypted: string | null
  created_at: string
  updated_at: string
}

/**
 * 2) Define your public schema interface
 */
export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'uid'>
        Update: Partial<UserProfile>
      }
      payment_methods: {
        Row: PaymentMethod
        Insert: Omit<PaymentMethod, 'id' | 'created_at'>
        Update: Partial<PaymentMethod>
      }
      user_security: {
        Row:    UserSecurity
        Insert: Omit<UserSecurity, 'created_at' | 'updated_at'> & { user_id: string }
        Update: Partial<Omit<UserSecurity, 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

/**
 * 3) Initialize a typed Supabase client
 */
export const supabase: SupabaseClient<Database, 'public'> = createClient<Database, 'public'>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function getServerSupabaseClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerSupabaseClient({ req, res })
}
/**
 * 4) Internal helper: get the currently logged‑in user
 */
async function getCurrentUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not authenticated')
  return data.user
}

/**
 * 5a) Sign up — uses Supabase Auth only
 */
export async function signUpUser(
  email: string,
  password: string
): Promise<{ user: User; session: Session | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  return { user: data.user!, session: data.session }
}
/**
 * 5b) Sign in
 */
export async function signInUser(
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { user: data.user!, session: data.session! }
}

/**
 * 5c) Sign out
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * 6) Fetch full user + profile row
 */
export async function fetchUserProfile(): Promise<{
  user: User
  profile: UserProfile
}> {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('uid', user.id)
    .single()
  if (error) throw error
  return { user, profile: data }
}

/**
 * 7) Update mutable profile fields
 */
export async function updateUserProfile(
  updates: Partial<Omit<UserProfile, 'uid' | 'role' | 'full_name' | 'kyc_status'>>
) {
  const { user } = await fetchUserProfile()
  const { error } = await supabase
    .from('user_profile')
    .update(updates)
    .eq('uid', user.id)
  if (error) throw error
}

/**
 * 8) Update Auth email, phone, password
 */
export async function updateUserEmail(newEmail: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
  return data.user!
}

export async function updateUserPhone(newPhone: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({ phone: newPhone })
  if (error) throw error
  return data.user!
}

export async function updateUserPassword(newPassword: string): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data.user!
}

/**
 * 9) Payment methods CRUD
 */
export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { user } = await fetchUserProfile()
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addPaymentMethod(params: {
  type: string
  bank_name?: string
  account_number: string
  iban: string
  account_title: string
}) {
  const { user } = await fetchUserProfile()
  const { error } = await supabase
    .from('payment_methods')
    .insert([{ user_id: user.id, ...params }])
  if (error) throw error
}

export async function updatePaymentMethod(
  id: string,
  params: {
    type: string
    bank_name?: string
    account_number: string
    iban: string
    account_title: string
  }
) {
  const { user } = await fetchUserProfile()
  const { error } = await supabase
    .from('payment_methods')
    .update(params)
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function deletePaymentMethod(id: string) {
  const { user } = await fetchUserProfile()
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

/**
 * 10) Security methods (TOTP / SMS / Email)
 */
export async function fetchUserSecurity(): Promise<{
  totp_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
}> {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('user_security')
    .select('totp_enabled, sms_enabled, email_enabled')
    .eq('user_id', user.id)
    .single()

  if (error && (error as PostgrestError).code === 'PGRST116') {
    return { totp_enabled: false, sms_enabled: false, email_enabled: false }
  }
  if (error) throw error
  return {
    totp_enabled: data.totp_enabled,
    sms_enabled: data.sms_enabled,
    email_enabled: data.email_enabled,
  }
}

export async function setSecurityMethods(params: {
  sms_enabled?: boolean
  email_enabled?: boolean
  totp_enabled?: boolean
  totp_factor_sid?: string
  totp_secret?: string
}) {
  const { user } = await fetchUserProfile()
  const { error } = await supabase
    .from('user_security')
    .upsert(
      [{ user_id: user.id, ...params }],
      { onConflict: 'user_id' }
    )
  if (error) throw error
}