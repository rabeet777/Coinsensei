"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { formatAddress, formatAmount } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  address: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
  transaction_hash?: string
}

export function WithdrawalsTable() {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "approved" })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] })
      toast({
        title: "Success",
        description: "Withdrawal request approved",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to approve withdrawal request",
        variant: "destructive",
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] })
      toast({
        title: "Success",
        description: "Withdrawal request rejected",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to reject withdrawal request",
        variant: "destructive",
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User ID</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Transaction Hash</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals?.map((withdrawal: Withdrawal) => (
          <TableRow key={withdrawal.id}>
            <TableCell>{withdrawal.user_id}</TableCell>
            <TableCell>{formatAmount(withdrawal.amount)}</TableCell>
            <TableCell>{formatAddress(withdrawal.address)}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  withdrawal.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : withdrawal.status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {withdrawal.status}
              </span>
            </TableCell>
            <TableCell>
              {new Date(withdrawal.created_at).toLocaleString()}
            </TableCell>
            <TableCell>
              {withdrawal.transaction_hash ? (
                <a
                  href={`https://tronscan.org/#/transaction/${withdrawal.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {formatAddress(withdrawal.transaction_hash)}
                </a>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {withdrawal.status === "pending" && (
                <div className="space-x-2">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(withdrawal.id)}
                    disabled={approveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(withdrawal.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 