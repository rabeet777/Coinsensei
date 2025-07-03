// src/app/admin/payment-methods/page.tsx
'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient }            from '@supabase/auth-helpers-nextjs'
import type { Database }                          from '@/lib/database.types'

type MethodType = 'Bank transfer' | 'JazzCash' | 'EasyPaisa' | 'Raast'

interface AdminPaymentMethod {
  id:              string
  admin_id:        string
  type:            MethodType
  bank_name?:      string
  account_number:  string
  iban:            string
  account_title:   string
  created_at:      string
}

export default function AdminPaymentMethodsPage() {
  // ← use the auth-helpers client
  const supabase = createClientComponentClient<Database>()

  const [methods,     setMethods]     = useState<AdminPaymentMethod[]>([])
  const [tab,         setTab]         = useState<'list'|'add'>('list')
  const [editingId,   setEditingId]   = useState<string|null>(null)
  const [type,        setType]        = useState<MethodType>('Bank transfer')
  const [bankName,    setBankName]    = useState<string>('')
  const [accountNum,  setAccountNum]  = useState<string>('')
  const [iban,        setIban]        = useState<string>('')
  const [title,       setTitle]       = useState<string>('')
  const [error,       setError]       = useState<string|null>(null)
  const [success,     setSuccess]     = useState<string|null>(null)
  const [loading,     setLoading]     = useState<boolean>(false)

  // Load existing methods
  const loadMethods = async () => {
    setError(null)
    const { data, error: err } = await supabase
      .from('admin_payment_methods')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      console.error('loadMethods error', err)
      setError(err.message)
    } else {
      setMethods(data ?? [])
    }
  }

  useEffect(() => {
    loadMethods()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setType('Bank transfer')
    setBankName('')
    setAccountNum('')
    setIban('')
    setTitle('')
    setError(null)
    setSuccess(null)
  }

  const beginEdit = (m: AdminPaymentMethod) => {
    setEditingId(m.id)
    setType(m.type)
    setBankName(m.bank_name ?? '')
    setAccountNum(m.account_number)
    setIban(m.iban)
    setTitle(m.account_title)
    setTab('add')
  }

  // Create new method
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    try {
      // get the signed-in admin
      const { data:{ user }, error: usrErr } = await supabase.auth.getUser()
      if (usrErr || !user) throw new Error('Not authenticated')

      const payload = {
        admin_id:       user.id,
        type,
        bank_name:      type === 'Bank transfer' ? bankName : null,
        account_number: accountNum,
        iban,
        account_title:  title,
      }

      const { data, error: insErr } = await supabase
        .from('admin_payment_methods')
        .insert([payload])
        .select('*')
        .single()

      console.log('handleAdd result', { data, insErr })
      if (insErr) throw insErr

      setSuccess('Added successfully!')
      resetForm()
      setTab('list')
      await loadMethods()
    } catch (e: any) {
      console.error('handleAdd error', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Update
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setError(null); setSuccess(null); setLoading(true)
    try {
      const payload = {
        type,
        bank_name:      type === 'Bank transfer' ? bankName : null,
        account_number: accountNum,
        iban,
        account_title:  title,
      }

      const { data, error: updErr } = await supabase
        .from('admin_payment_methods')
        .update(payload)
        .eq('id', editingId)
        .select('*')
        .single()

      console.log('handleUpdate result', { data, updErr })
      if (updErr) throw updErr

      setSuccess('Updated successfully!')
      resetForm()
      setTab('list')
      await loadMethods()
    } catch (e: any) {
      console.error('handleUpdate error', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this method?')) return
    setError(null); setSuccess(null); setLoading(true)
    try {
      const { data, error: delErr } = await supabase
        .from('admin_payment_methods')
        .delete()
        .eq('id', id)

      console.log('handleDelete result', { data, delErr })
      if (delErr) throw delErr

      setSuccess('Deleted successfully!')
      await loadMethods()
    } catch (e: any) {
      console.error('handleDelete error', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-6">
      <h1 className="text-2xl font-bold">Admin Payment Methods</h1>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 -mb-px ${tab==='list'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-600'}`}
          onClick={() => { resetForm(); setTab('list') }}
        >
          Saved Methods
        </button>
        <button
          className={`ml-4 px-4 py-2 -mb-px ${tab==='add'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-600'}`}
          onClick={() => { resetForm(); setTab('add') }}
        >
          {editingId ? 'Edit Method' : 'Add New'}
        </button>
      </div>

      {/* List View */}
      {tab === 'list' && (
        <div className="space-y-4">
          {methods.length === 0
            ? <p className="text-gray-500">No methods yet.</p>
            : methods.map(m => (
                <div key={m.id} className="border p-4 rounded relative">
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button onClick={()=>beginEdit(m)} className="text-blue-500">✏️</button>
                    <button onClick={()=>handleDelete(m.id)} className="text-red-500">🗑️</button>
                  </div>
                  <p><strong>{m.type}</strong></p>
                  {m.type==='Bank transfer' && <p>Bank: {m.bank_name}</p>}
                  <p>Acct #: {m.account_number}</p>
                  <p>IBAN: {m.iban}</p>
                  <p>Title: {m.account_title}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {tab === 'add' && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4 max-w-md">
          {(error || success) && (
            <div className={error ? 'text-red-600' : 'text-green-600'}>
              {error || success}
            </div>
          )}

          <label className="block">
            <span>Type</span>
            <select
              value={type}
              onChange={e => setType(e.target.value as MethodType)}
              required
              className="mt-1 w-full border rounded p-2"
            >
              <option value="Bank transfer">Bank transfer</option>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="Raast">Raast</option>
            </select>
          </label>

          {type==='Bank transfer' && (
            <label className="block">
              <span>Bank Name</span>
              <input
                type="text"
                value={bankName}
                onChange={e=>setBankName(e.target.value)}
                required
                className="mt-1 w-full border rounded p-2"
              />
            </label>
          )}

          <label className="block">
            <span>Account Number</span>
            <input
              type="text"
              value={accountNum}
              onChange={e=>setAccountNum(e.target.value)}
              required
              className="mt-1 w-full border rounded p-2"
            />
          </label>

          <label className="block">
            <span>IBAN</span>
            <input
              type="text"
              value={iban}
              onChange={e=>setIban(e.target.value)}
              required
              className="mt-1 w-full border rounded p-2"
            />
          </label>

          <label className="block">
            <span>Account Title</span>
            <input
              type="text"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              required
              className="mt-1 w-full border rounded p-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {editingId ? 'Save Changes' : 'Save Method'}
          </button>
        </form>
      )}
    </div>
  )
}
