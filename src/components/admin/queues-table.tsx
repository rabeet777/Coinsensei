"use client"

import { useQuery } from "@tanstack/react-query"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QueueStats {
  queue_name: string
  active: number
  completed: number
  failed: number
  delayed: number
  waiting: number
}

export function QueuesTable() {
  const supabase = createClientComponentClient()

  const { data: queueStats, isLoading } = useQuery<QueueStats[]>({
    queryKey: ["queue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("queue_stats")
        .select("*")
        .order("queue_name")

      if (error) throw error
      return data
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {queueStats?.map((queue) => (
        <Card key={queue.queue_name}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {queue.queue_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{queue.active}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {queue.completed}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {queue.failed}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {queue.waiting}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 