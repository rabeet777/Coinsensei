'use client'

import { useState, useEffect } from 'react'
import io from 'socket.io-client'

// Define the shape of a raw order as returned by your API / RPC:
interface RawOrder {
  id:           string
  user_id:      string
  type:         'buy' | 'sell'
  price:        number
  amount:       number
  filled:       number
  status:       'pending' | 'complete' | 'cancelled'
  created_at:   string
  updated_at:   string
  executed_at:  string | null
  cancelled_at: string | null
}

// After aggregation, each price level has a single totalRemaining
interface PriceLevel {
  price:         number
  totalRemaining: number
}

// Hooks up to Socket.IO and provides live updates
export default function OrderBook() {
  const [buyLevels, setBuyLevels]   = useState<PriceLevel[]>([])
  const [sellLevels, setSellLevels] = useState<PriceLevel[]>([])

  // 1) Fetch initial snapshot on mount
  useEffect(() => {
    async function loadInitialBook() {
      try {
        const res = await fetch('/api/getOrderBook')
        const json = await res.json()
        // json.buy / json.sell are arrays of RawOrder
        if (Array.isArray(json.buy) && Array.isArray(json.sell)) {
          aggregateAndSet(json.buy, json.sell)
        }
      } catch (err) {
        console.error('Failed to fetch initial order book:', err)
      }
    }
    loadInitialBook()
  }, [])

  // 2) Subscribe to live updates via Socket.IO
  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    )

    socket.on('connect', () => {
      console.log('OrderBook socket connected:', socket.id)
    })

    socket.on('orderBookUpdate', (book: { buy: RawOrder[]; sell: RawOrder[] }) => {
      // Aggregate the new raw arrays into price levels
      aggregateAndSet(book.buy, book.sell)
    })

    socket.on('disconnect', () => {
      console.log('OrderBook socket disconnected')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  /** 
   * Helper: take arrays of RawOrder for buys & sells,
   * build aggregated PriceLevel[] for each side and sort appropriately.
   */
  function aggregateAndSet(buys: RawOrder[], sells: RawOrder[]) {
    // 1) Build a Map to accumulate remaining amount per price
    const buyMap  = new Map<number, number>()
    const sellMap = new Map<number, number>()

    // Helper to add one order into the given map
    function accumulate(
      orderArr: RawOrder[],
      map: Map<number, number>
    ) {
      for (const o of orderArr) {
        if (o.status !== 'pending') continue
        const remaining = Number(o.amount) - Number(o.filled)
        if (remaining <= 0) continue

        // If this price already exists in the map, increase it
        const prev = map.get(o.price) ?? 0
        map.set(o.price, prev + remaining)
      }
    }

    accumulate(buys, buyMap)
    accumulate(sells, sellMap)

    // 2) Convert each map into a sorted array of PriceLevel
    //    For buys: sort descending (highest bids first)
    //    For sells: sort ascending (lowest asks first)
    const buyArr: PriceLevel[] = Array.from(buyMap.entries())
      .map(([price, totalRemaining]) => ({ price, totalRemaining }))
      .sort((a, b) => b.price - a.price)

    const sellArr: PriceLevel[] = Array.from(sellMap.entries())
      .map(([price, totalRemaining]) => ({ price, totalRemaining }))
      .sort((a, b) => a.price - b.price)

    setBuyLevels(buyArr)
    setSellLevels(sellArr)
  }

  return (
    <div className="flex gap-8">
      {/* Buy Side */}
      <div className="w-1/2 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold text-green-700">Buy (Bids)</h2>
        {buyLevels.length === 0 ? (
          <p className="mt-2 text-center text-gray-500">(no bids)</p>
        ) : (
          <table className="mt-2 w-full text-right table-auto">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-1">Price (PKR)</th>
                <th className="px-2 py-1">Total USDT</th>
              </tr>
            </thead>
            <tbody>
              {buyLevels.map((lvl) => (
                <tr key={lvl.price}>
                  <td className="px-2 py-1 text-green-600 font-medium">
                    {lvl.price.toFixed(2)}
                  </td>
                  <td className="px-2 py-1">{lvl.totalRemaining.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sell Side */}
      <div className="w-1/2 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold text-red-600">Sell (Asks)</h2>
        {sellLevels.length === 0 ? (
          <p className="mt-2 text-center text-gray-500">(no asks)</p>
        ) : (
          <table className="mt-2 w-full text-right table-auto">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-1">Price (PKR)</th>
                <th className="px-2 py-1">Total USDT</th>
              </tr>
            </thead>
            <tbody>
              {sellLevels.map((lvl) => (
                <tr key={lvl.price}>
                  <td className="px-2 py-1 text-red-600 font-medium">
                    {lvl.price.toFixed(2)}
                  </td>
                  <td className="px-2 py-1">{lvl.totalRemaining.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
