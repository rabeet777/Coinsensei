"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  WalletIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ServerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldExclamationIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UserGroupIcon,
  ChevronDownIcon,
  HomeIcon,
  CreditCardIcon,
  CircleStackIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from "@heroicons/react/24/outline"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const navigationConfig = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: HomeIcon,
    exact: true
  },
  {
    title: "Users",
    icon: UsersIcon,
    children: [
      { title: "All Users", href: "/admin/users", icon: UserGroupIcon },
      { title: "KYC Reviews", href: "/admin/kyc", icon: ShieldCheckIcon, badge: "urgent" },
      { title: "User Verification", href: "/admin/verification", icon: ShieldExclamationIcon },
      { title: "Recovery Requests", href: "/admin/recovery-requests", icon: ShieldExclamationIcon }
    ]
  },
  {
    title: "Financial",
    icon: CurrencyDollarIcon,
    children: [
      { title: "P2P Express", href: "/admin/p2p-express", icon: CreditCardIcon },
      { title: "PKR Deposits", href: "/admin/deposits/pkr", icon: ArrowDownTrayIcon },
      { title: "PKR Withdrawals", href: "/admin/withdrawls/pkr", icon: ArrowUpTrayIcon },
      { title: "USDT Withdrawals", href: "/admin/usdt-withdrawals", icon: ArrowUpTrayIcon },
      { title: "Payment Methods", href: "/admin/payment-methods", icon: CreditCardIcon }
    ]
  },
  {
    title: "Trading",
    icon: ChartBarIcon,
    children: [
      { title: "Orders", href: "/admin/orders", icon: DocumentTextIcon },
      { title: "Trades", href: "/admin/trades", icon: ArrowDownTrayIcon },
      { title: "Trade Analytics", href: "/admin/trade-analytics", icon: ChartBarIcon }
    ]
  },
  {
    title: "Wallets",
    icon: WalletIcon,
    children: [
      { title: "PKR Wallets", href: "/admin/pkr-wallets", icon: BanknotesIcon },
      { title: "USDT Wallets", href: "/admin/usdt-wallets", icon: WalletIcon },
      { title: "USDT Deposits", href: "/admin/usdt-deposits", icon: ArrowDownTrayIcon },
      { title: "Wallet Analytics", href: "/admin/wallet-analytics", icon: ChartBarIcon }
    ]
  },
  {
    title: "System",
    icon: ServerIcon,
    children: [
      { title: "Workers", href: "/admin/workers", icon: ServerIcon, badge: "live" },
      { title: "Queues", href: "/admin/queues", icon: CircleStackIcon },
      { title: "System Health", href: "/admin/system-health", icon: ShieldExclamationIcon },
      { title: "API Monitoring", href: "/admin/api-monitoring", icon: ChartBarIcon }
    ]
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon
  }
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActiveRoute = (href: string, exact = false) => {
    if (!pathname) return false
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children: any[]) => {
    return children.some(child => isActiveRoute(child.href))
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left Navigation */}
      <nav className="flex items-center space-x-1">
        {navigationConfig.map((item) => {
        const Icon = item.icon
          const isActive = item.href ? isActiveRoute(item.href, item.exact) : hasActiveChild(item.children || [])
          
          if (item.children) {
            // Dropdown menu item
            return (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.title)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                  <ChevronDownIcon className="ml-1 h-3 w-3" />
                </button>

                <AnimatePresence>
                  {activeDropdown === item.title && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                    >
                      {item.children.map((child, index) => {
                        const ChildIcon = child.icon
                        const isChildActive = isActiveRoute(child.href)
                        
                        return (
                          <motion.div
                            key={child.href}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center px-4 py-3 text-sm transition-colors group",
                                isChildActive
                                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                              )}
                            >
                              <div className={cn(
                                "p-1.5 rounded-md mr-3 transition-colors",
                                isChildActive
                                  ? "bg-blue-100"
                                  : "bg-gray-100 group-hover:bg-blue-100"
                              )}>
                                <ChildIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{child.title}</div>
                              </div>
                              {child.badge && (
                                <span className={cn(
                                  "px-2 py-0.5 text-xs font-medium rounded-full",
                                  child.badge === "urgent" 
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                )}>
                                  {child.badge === "urgent" ? "!" : "●"}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          } else {
            // Single link item
        return (
          <Link
            key={item.href}
                href={item.href!}
            className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        )
          }
      })}
    </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <MagnifyingGlassIcon className="h-4 w-4" />
        </button>
        
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <BellIcon className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
        </button>

        {/* System Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          System Online
        </div>

        {/* Admin User Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">System Administrator</p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 