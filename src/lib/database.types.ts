export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface UserProfile {
  id: string            // PK = auth.uid
  full_name: string     // admin‑filled only
  username: string | null
  phone_number: string | null
  avatar_url: string | null
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected'
}

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'kyc_status'> & { kyc_status?: UserProfile['kyc_status'] }
        Update: Partial<UserProfile>
      }
      user_payment_methods: {
        Row: {
          id: string
          type: string
          bank_name: string | null
          account_number: string
          iban: string
          account_title: string
          created_at: string
        }
        Insert: {
          type: string
          bank_name?: string | null
          account_number: string
          iban: string
          account_title: string
        }
        Update: {
          type?: string
          bank_name?: string | null
          account_number?: string
          iban?: string
          account_title?: string
        }
      }
    }
    // … Views, Functions, etc.
  }
}
