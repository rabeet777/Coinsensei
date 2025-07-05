'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo'
import { 
  ChevronDown, 
  User, 
  Wallet, 
  History, 
  CreditCard, 
  Shield, 
  Settings, 
  LogOut,
  Home,
  PlusCircle,
  ArrowRightLeft,
  Bell,
  Search,
  Menu,
  X,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import { signOutUser } from '@/lib/supabase'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

export default function NavbarUser({
  displayName,
}: {
  profileImage?: string
  displayName?: string
}) {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [depositDropdownOpen, setDepositDropdownOpen] = useState(false)
  const [withdrawDropdownOpen, setWithdrawDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const depositDropdownRef = useRef<HTMLDivElement>(null)
  const withdrawDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user profile picture
  useEffect(() => {
    if (!session?.user?.id) {
      setLoadingProfile(false)
      return
    }

    async function fetchUserProfile() {
      if (!session?.user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('avatar_url')
          .eq('uid', session.user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        } else if (data?.avatar_url) {
          setProfileImage(data.avatar_url)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [session?.user?.id, supabase])

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (depositDropdownRef.current && !depositDropdownRef.current.contains(e.target as Node)) {
        setDepositDropdownOpen(false)
      }
      if (withdrawDropdownRef.current && !withdrawDropdownRef.current.contains(e.target as Node)) {
        setWithdrawDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = async () => {
    await signOutUser()
    router.push('/auth/login')
  }

  // Initials fallback
  const initials = displayName
    ? displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  const navigationLinks = [
    { title: 'Dashboard', icon: Home, href: '/user/dashboard' },
    { title: 'Trade', icon: ArrowRightLeft, href: '/user/trade' },
    { title: 'P2P Express', icon: CreditCard, href: '/user/p2p-express' },
    { 
      title: 'Deposit', 
      icon: ArrowDownLeft, 
      hasDropdown: true,
      dropdownItems: [
        { title: 'Deposit PKR', href: '/user/deposits/pkr', icon: ArrowDownLeft },
        { title: 'Deposit USDT', href: '/user/deposits/usdt', icon: ArrowDownLeft },
      ]
    },
    { 
      title: 'Withdraw', 
      icon: ArrowUpRight, 
      hasDropdown: true,
      dropdownItems: [
        { title: 'Withdraw PKR', href: '/user/withdraw/pkr', icon: ArrowUpRight },
        { title: 'Withdraw USDT', href: '/user/withdraw/usdt', icon: ArrowUpRight },
      ]
    },
    { title: 'History', icon: History, href: '/user/transactions' },
  ]

  const userMenuItems = [
    { title: 'Payment Methods', icon: CreditCard, href: '/user/payment-methods' },
    { title: 'Account Settings', icon: Settings, href: '/user/account-settings' },
    { title: 'KYC Verification', icon: Shield, href: '/user/kyc' },
    { title: 'Security', icon: Shield, href: '/user/security' },
  ]

  return (
    <nav className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Link href="/user/dashboard">
              <CoinsenseiLogo size="xl" />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationLinks.map((link, index) => (
              <motion.div
                key={link.title}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                {link.hasDropdown ? (
                  <div 
                    className="relative" 
                    ref={link.title === 'Deposit' ? depositDropdownRef : withdrawDropdownRef}
                  >
                    <Button
                      variant="ghost"
                      className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => {
                        if (link.title === 'Deposit') {
                          setDepositDropdownOpen(!depositDropdownOpen)
                          setWithdrawDropdownOpen(false)
                        } else {
                          setWithdrawDropdownOpen(!withdrawDropdownOpen)
                          setDepositDropdownOpen(false)
                        }
                      }}
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.title}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>

                    <AnimatePresence>
                      {((link.title === 'Deposit' && depositDropdownOpen) || 
                        (link.title === 'Withdraw' && withdrawDropdownOpen)) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-white border border-blue-100 rounded-xl shadow-lg overflow-hidden z-50"
                        >
                          {link.dropdownItems?.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              onClick={() => {
                                setDepositDropdownOpen(false)
                                setWithdrawDropdownOpen(false)
                              }}
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                            >
                              <item.icon className="h-4 w-4" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href={link.href!}>
                    <Button 
                      variant="ghost" 
                      className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.title}
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            {/* User Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 hover:bg-blue-50 transition-all duration-200"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-base font-semibold text-blue-700">
                      {initials || <User className="w-5 h-5 text-blue-600" />}
                    </span>
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Verified Account</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-blue-100 rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                      <div className="flex items-center gap-3">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-700">
                              {initials || <User className="w-5 h-5 text-blue-600" />}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{displayName || 'User'}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {userMenuItems.map((item, index) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-blue-100">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-blue-100 bg-white"
            >
              <div className="py-4 space-y-2">
                {/* User Profile Section */}
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg mx-4 mb-4">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-700">
                        {initials || <User className="w-5 h-5 text-blue-600" />}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{displayName || 'User'}</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>

                {/* Navigation Links with sub-items for mobile */}
                {navigationLinks.map((link) => (
                  <div key={link.title}>
                    {link.hasDropdown ? (
                      <div className="px-4">
                        <div className="flex items-center gap-3 py-3 text-gray-700 font-medium">
                          <link.icon className="h-5 w-5" />
                          <span>{link.title}</span>
                        </div>
                        <div className="ml-8 space-y-1">
                          {link.dropdownItems?.map((item) => (
                            <Link
                              key={item.title}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 rounded-lg"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={link.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                      >
                        <link.icon className="h-5 w-5" />
                        <span className="font-medium">{link.title}</span>
                      </Link>
                    )}
                  </div>
                ))}

                <div className="border-t border-blue-100 my-2"></div>

                {/* User Menu Items */}
                {userMenuItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                ))}

                <div className="border-t border-blue-100 my-2"></div>

                {/* Mobile Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
