// src/app/user/payment-methods/page.tsx
'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  CreditCard, 
  Building, 
  Plus, 
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  User,
  Hash,
  Receipt,
  Calendar,
  Save,
  X
} from 'lucide-react'

type PaymentMethodRow = Database['public']['Tables']['user_payment_methods']['Row']
type NewPaymentMethod = Database['public']['Tables']['user_payment_methods']['Insert']

export default function PaymentMethodsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const [methods, setMethods] = useState<PaymentMethodRow[]>([])
  const [tab, setTab] = useState<'list' | 'add'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [type, setType] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [iban, setIban] = useState('')
  const [accountTitle, setAccountTitle] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  // fetch this user's methods
  const loadMethods = async () => {
    setError(null)
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()
    if (sessErr || !session) {
      setError('Not authenticated')
      return
    }
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setMethods(data ?? [])
    setLoadingData(false)
  }

  useEffect(() => { loadMethods() }, [])

  const resetForm = () => {
    setEditingId(null)
    setType('')
    setBankName('')
    setAccountNumber('')
    setIban('')
    setAccountTitle('')
    setError(null)
    setSuccess(null)
  }

  const beginEdit = (m: PaymentMethodRow) => {
    setEditingId(m.id)
    setType(m.type)
    setBankName(m.bank_name ?? '')
    setAccountNumber(m.account_number)
    setIban(m.iban)
    setAccountTitle(m.account_title)
    setTab('add')
  }

  // CREATE
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr || !session) throw new Error('Not authenticated')

      // cast to any so TS won't complain about user_id missing in Insert type
      const payload = [{
        user_id: session.user.id,
        type,
        bank_name: type === 'Bank transfer' ? bankName : null,
        account_number: accountNumber,
        iban,
        account_title: accountTitle,
      }] as any

      const { error } = await supabase
        .from('user_payment_methods')
        .insert(payload)

      if (error) throw error
      setSuccess('Payment method saved successfully!')
      resetForm()
      setTab('list')
      await loadMethods()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // UPDATE
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setError(null); setSuccess(null); setLoading(true)
    try {
      const updates: Partial<NewPaymentMethod> = {
        type,
        bank_name: type === 'Bank transfer' ? bankName : null,
        account_number: accountNumber,
        iban,
        account_title: accountTitle,
      }
      const { error } = await supabase
        .from('user_payment_methods')
        .update(updates)
        .eq('id', editingId)

      if (error) throw error
      setSuccess('Payment method updated successfully!')
      resetForm()
      setTab('list')
      await loadMethods()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase
        .from('user_payment_methods')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSuccess('Payment method deleted successfully!')
      await loadMethods()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'Bank transfer':
        return <Building className="h-5 w-5" />
      case 'JazzCash':
        return <CreditCard className="h-5 w-5 text-orange-600" />
      case 'EasyPaisa':
        return <CreditCard className="h-5 w-5 text-green-600" />
      case 'Raast':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getPaymentColor = (type: string) => {
    switch (type) {
      case 'Bank transfer':
        return 'bg-blue-100 text-blue-800'
      case 'JazzCash':
        return 'bg-orange-100 text-orange-800'
      case 'EasyPaisa':
        return 'bg-green-100 text-green-800'
      case 'Raast':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Payment Methods
              </h1>
              <p className="text-gray-600 mt-1">Manage your payment methods for withdrawals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className={`border-0 ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 ${error ? 'text-red-800' : 'text-green-800'}`}>
                    {error ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">{error || success}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <Card className="border-0 shadow-md mb-8">
          <CardContent className="p-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
        <button
                className={`flex-1 py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${
                  tab === 'list'
                    ? 'bg-white shadow-sm text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
          onClick={() => { resetForm(); setTab('list') }}
        >
                <CreditCard className="h-4 w-4" />
                Saved Methods ({methods.length})
        </button>
        <button
                className={`flex-1 py-3 px-4 rounded-md transition-all flex items-center justify-center gap-2 ${
                  tab === 'add'
                    ? 'bg-white shadow-sm text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
          onClick={() => { resetForm(); setTab('add') }}
        >
                {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Edit Method' : 'Add New'}
        </button>
      </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {/* LIST TAB */}
      {tab === 'list' && (
            <motion.div key="list" {...fadeInUp}>
              {methods.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CreditCard className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Methods</h3>
                    <p className="text-gray-600 mb-6">Add your first payment method to start withdrawing funds</p>
                    <Button 
                      onClick={() => setTab('add')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {methods.map((method, index) => (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${getPaymentColor(method.type)}`}>
                                {getPaymentIcon(method.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{method.type}</h3>
                                <Badge variant="outline" className="mt-1">
                                  {method.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => beginEdit(method)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(method.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                  </div>
                </div>

                          <div className="space-y-3">
                            {method.type === 'Bank transfer' && method.bank_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Bank:</span>
                                <span className="font-medium">{method.bank_name}</span>
        </div>
      )}

                            <div className="flex items-center gap-2 text-sm">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Account:</span>
                              <span className="font-mono font-medium">{method.account_number}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">IBAN:</span>
                              <span className="font-mono font-medium text-xs">{method.iban}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Title:</span>
                              <span className="font-medium">{method.account_title}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">
                                Added {new Date(method.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ADD/EDIT TAB */}
      {tab === 'add' && (
            <motion.div key="add" {...fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingId ? <Edit className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                    {editingId ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </CardTitle>
                  <CardDescription>
                    {editingId 
                      ? 'Update your payment method details' 
                      : 'Add a new payment method for withdrawals'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
                    className="space-y-6 max-w-md"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method Type
                      </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
                        <option value="">Select payment method...</option>
              <option>Bank transfer</option>
              <option>JazzCash</option>
              <option>EasyPaisa</option>
              <option>Raast</option>
            </select>
                    </div>

          {type === 'Bank transfer' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name
                        </label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                          placeholder="Enter bank name"
                required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
              required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
            />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IBAN
          </label>
            <input
              type="text"
              value={iban}
              onChange={e => setIban(e.target.value)}
                        placeholder="Enter IBAN"
              required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
            />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Title
          </label>
            <input
              type="text"
              value={accountTitle}
              onChange={e => setAccountTitle(e.target.value)}
                        placeholder="Enter account holder name"
              required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Important Note</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Ensure all details are accurate to avoid withdrawal delays</li>
                        <li>• Account title should match your verified identity</li>
                        <li>• Double-check account number and IBAN</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button
            type="submit"
            disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            {editingId ? 'Updating...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingId ? 'Update Method' : 'Save Method'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { resetForm(); setTab('list') }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
        </form>
                </CardContent>
              </Card>
            </motion.div>
      )}
        </AnimatePresence>
      </div>
    </div>
  )
}
