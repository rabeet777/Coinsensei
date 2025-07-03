// src/worker/orderWatcher.ts
import { createClient } from '@supabase/supabase-js'
import { fetchCurrentOrderBook } from '@/services/tradeService'
import { emitOrderBook } from '@/websockets/orderBookSocket'

const supabaseListener = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

supabaseListener
  .channel('orders-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    async (payload) => {
      // Any time an order is inserted/updated/deleted, re‐broadcast
      const book = await fetchCurrentOrderBook()
      emitOrderBook(book)
    }
  )
  .subscribe()
