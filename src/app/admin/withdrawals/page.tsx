import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { WithdrawalsTable } from "@/components/admin/withdrawals-table"

export default async function WithdrawalsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Get user profile to check admin role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("user_profile")
    .select("role")
    .eq("id", user?.id)
    .single()

  if (!user || profile?.role !== "admin") {
    return null // Middleware will handle the redirect
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Withdrawals Management</h1>
      <WithdrawalsTable />
    </div>
  )
} 