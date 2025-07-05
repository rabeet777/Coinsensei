// src/app/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo';
import { BubbleBackground } from '@/components/BubbleBackground';
import { supabase } from 'lib/supabase';
import {
  ChevronRight,
  ArrowRight,
  DollarSign,
  Shield,
  LineChart,
  Users,
  Wallet,
  TrendingUp,
  BadgeDollarSign,
  Blocks,
  CreditCard,
  Phone,
  Building2,
  Zap,
  Lock,
  Eye,
  CheckCircle,
  Star,
  Globe,
  RefreshCw,
  UserCheck,
  Smartphone,
  Banknote,
  Clock,
  Award,
  HeadphonesIcon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const slideIn = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6 }
  };

  return (
    <>
      <Head>
        <title>COINSENSEI - Pakistan's Premier P2P Crypto Exchange</title>
        <meta
          name="description"
          content="Trade USDT seamlessly with P2P transactions. Support for JazzCash, EasyPaisa, Bank Transfer & Raast. Secure, fast, and trusted by thousands."
        />
        <meta
          property="og:title"
          content="COINSENSEI - Pakistan's Premier P2P Crypto Exchange"
        />
        <meta
          property="og:description"
          content="Trade USDT seamlessly with P2P transactions. Support for JazzCash, EasyPaisa, Bank Transfer & Raast. Secure, fast, and trusted by thousands."
        />
        <meta property="og:image" content="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Enhanced Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 fixed top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Left */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link href="/">
              <CoinsenseiLogo size="xl" showText={false} />
            </Link>
          </motion.div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {['Features', 'Payment Methods', 'Security', 'How It Works'].map((item, index) => (
              <motion.div
                key={item}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link 
                  href={`/#${item.toLowerCase().replace(' ', '-')}`} 
                  className="hover:text-blue-600 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop Auth Buttons - Right */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="default" size="sm" className="btn-shimmer btn-glow shadow-lg">
                  <Link href="/dashboard">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild variant="outline" size="sm" className="border-2 border-blue-500/60 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 backdrop-blur-sm bg-white/90 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 font-semibold px-7 py-2.5">
                    <Link href="/auth/login" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="sm" className="btn-shimmer btn-glow shadow-lg px-8 py-2.5 font-semibold">
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 py-4 border-t border-gray-200"
            >
              <div className="flex flex-col space-y-4">
                {['Features', 'Payment Methods', 'Security', 'How It Works'].map((item) => (
                  <Link
                    key={item}
                    href={`/#${item.toLowerCase().replace(' ', '-')}`}
                    className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  {user ? (
                    <Button asChild className="btn-shimmer">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/auth/login">Login</Link>
                      </Button>
                      <Button asChild className="btn-shimmer">
                        <Link href="/auth/signup">Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
          <BubbleBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-5xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex justify-center mb-8"
              >
                <Badge variant="secondary" className="px-6 py-3 text-base font-medium text-blue-600 bg-blue-100 border-blue-200">
                  <Star className="mr-2 h-4 w-4" />
                  Pakistan's Most Trusted P2P Platform
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
                <motion.span 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-shimmer inline-block"
                >
                  Trade Crypto
                </motion.span>
                <br />
                <motion.span 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-gray-900"
                >
                  The Smart Way
                </motion.span>
              </h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                Experience seamless P2P crypto trading with instant PKR settlements through{' '}
                <span className="font-semibold text-blue-600">JazzCash, EasyPaisa, Bank Transfer & Raast</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto mb-16"
              >
                {user ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild size="lg" className="py-4 px-8 text-lg btn-shimmer btn-glow shadow-xl">
                      <Link href="/dashboard">
                        Go to Trading <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild size="lg" className="py-4 px-8 text-lg btn-shimmer btn-glow shadow-xl">
                        <Link href="/auth/signup">
                          Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild variant="outline" size="lg" className="py-4 px-8 text-lg border-2 hover:bg-gray-50">
                        <Link href="#how-it-works">Learn How</Link>
                      </Button>
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Enhanced Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
              >
                {[
                  { icon: Users, text: "50,000+ Active Users", color: "blue" },
                  { icon: DollarSign, text: "₨2B+ Monthly Volume", color: "green" },
                  { icon: Shield, text: "Bank-Grade Security", color: "purple" }
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm"
                  >
                    <div className={`w-12 h-12 rounded-full bg-${item.color}-100 flex items-center justify-center`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <span className="font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section id="payment-methods" className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 lg:mb-16"
            >
              <Badge variant="outline" className="mb-4 text-sm font-medium">Payment Solutions</Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Multiple <span className="text-shimmer">Payment Options</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                Trade with your preferred payment method. Instant settlements and competitive rates guaranteed.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                {
                  icon: Phone,
                  name: "JazzCash",
                  description: "Instant mobile wallet transfers",
                  color: "from-red-500 to-orange-500",
                  features: ["Instant Transfer", "24/7 Available", "Low Fees"]
                },
                {
                  icon: Smartphone,
                  name: "EasyPaisa",
                  description: "Quick mobile payments",
                  color: "from-green-500 to-emerald-500",
                  features: ["Fast Settlement", "Secure", "Widely Accepted"]
                },
                {
                  icon: Building2,
                  name: "Bank Transfer",
                  description: "Traditional banking solution",
                  color: "from-blue-500 to-cyan-500",
                  features: ["IBFT Support", "All Major Banks", "Large Amounts"]
                },
                {
                  icon: Zap,
                  name: "Raast",
                  description: "State Bank's instant payment system",
                  color: "from-purple-500 to-pink-500",
                  features: ["Government Backed", "Ultra Fast", "Most Secure"]
                }
              ].map((method, index) => (
                <motion.div 
                  key={method.name} 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 group border-0 shadow-lg">
                    <CardHeader className="text-center">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                      >
                        <method.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <CardTitle className="text-xl font-bold">{method.name}</CardTitle>
                      <CardDescription className="text-gray-600">{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {method.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 lg:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 lg:mb-16"
            >
              <Badge variant="outline" className="mb-4 text-sm font-medium">Platform Features</Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Why Choose <span className="text-shimmer">COINSENSEI</span>?
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of P2P crypto trading with our advanced features and unmatched security.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Users,
                  title: "P2P Marketplace",
                  description: "Trade directly with other users at competitive rates with escrow protection.",
                  color: "blue"
                },
                {
                  icon: Clock,
                  title: "Instant Settlements",
                  description: "Lightning-fast payment processing with real-time balance updates.",
                  color: "green"
                },
                {
                  icon: LineChart,
                  title: "Real-time Rates",
                  description: "Live market rates updated every second for optimal trading decisions.",
                  color: "purple"
                },
                {
                  icon: Shield,
                  title: "Advanced Security",
                  description: "Multi-layer security with 2FA, cold storage, and insurance protection.",
                  color: "red"
                },
                {
                  icon: HeadphonesIcon,
                  title: "24/7 Support",
                  description: "Round-the-clock customer support in Urdu and English languages.",
                  color: "orange"
                },
                {
                  icon: Award,
                  title: "Verified Users",
                  description: "KYC-verified community ensuring safe and compliant transactions.",
                  color: "indigo"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={feature.title} 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
                    <CardHeader>
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4`}
                      >
                        <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                      </motion.div>
                      <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 lg:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 lg:mb-16"
            >
              <Badge variant="outline" className="mb-4 text-sm font-medium">Simple Process</Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Start Trading in <span className="text-shimmer">3 Easy Steps</span>
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            >
              {[
                {
                  step: "01",
                  title: "Sign Up & Verify",
                  description: "Create your account and complete KYC verification in minutes",
                  icon: UserCheck
                },
                {
                  step: "02",
                  title: "Choose Payment Method",
                  description: "Select from JazzCash, EasyPaisa, Bank Transfer, or Raast",
                  icon: CreditCard
                },
                {
                  step: "03",
                  title: "Start Trading",
                  description: "Browse offers, place orders, and trade with escrow protection",
                  icon: RefreshCw
                }
              ].map((step, index) => (
                <motion.div 
                  key={step.step} 
                  variants={scaleIn}
                  whileHover={{ scale: 1.05 }}
                  className="text-center group"
                >
                  <div className="relative mb-8">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                    >
                      <step.icon className="h-10 w-10 text-white" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-12 lg:py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-200 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
            <div className="absolute top-60 right-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
            <div className="absolute top-80 left-1/2 w-2 h-2 bg-purple-200 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-32 right-1/4 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce opacity-25"></div>
            <div className="absolute top-96 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-30"></div>
            <div className="absolute top-64 right-1/2 w-2 h-2 bg-purple-200 rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 lg:mb-16"
            >
              <Badge variant="outline" className="mb-4 text-sm font-medium border-blue-200 text-blue-600 bg-blue-50">Maximum Security</Badge>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Your Security is Our <span className="text-shimmer">Priority</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                Advanced security measures protect your assets and personal information at every step.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Lock,
                  title: "256-bit Encryption",
                  description: "Military-grade encryption protects all your data and transactions",
                  color: "blue"
                },
                {
                  icon: Shield,
                  title: "Cold Storage",
                  description: "99% of funds stored offline in secure, insured cold wallets",
                  color: "green"
                },
                {
                  icon: Eye,
                  title: "2FA Authentication",
                  description: "Two-factor authentication adds an extra layer of account security",
                  color: "purple"
                },
                {
                  icon: UserCheck,
                  title: "KYC Verification",
                  description: "Identity verification ensures a trusted trading community",
                  color: "orange"
                },
                {
                  icon: Blocks,
                  title: "Smart Escrow",
                  description: "Automated escrow system protects both buyers and sellers",
                  color: "red"
                },
                {
                  icon: Globe,
                  title: "Regulatory Compliance",
                  description: "Full compliance with Pakistani financial regulations and laws",
                  color: "indigo"
                }
              ].map((security, index) => (
                <motion.div 
                  key={security.title} 
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-12 h-12 bg-${security.color}-100 rounded-xl flex items-center justify-center mb-4`}
                      >
                        <security.icon className={`h-6 w-6 text-${security.color}-600`} />
                      </motion.div>
                      <CardTitle className="text-xl font-bold text-gray-900">{security.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{security.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 lg:py-16 bg-gradient-to-br from-blue-50 via-white to-gray-50 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-8 left-8 w-3 h-3 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute top-16 right-16 w-2 h-2 bg-purple-100 rounded-full animate-bounce opacity-15"></div>
            <div className="absolute top-24 left-1/3 w-2.5 h-2.5 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute top-32 right-1/4 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute top-40 left-1/2 w-2 h-2 bg-purple-100 rounded-full animate-bounce opacity-15"></div>
            <div className="absolute top-48 right-1/3 w-3 h-3 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute top-56 left-1/4 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute top-64 right-1/2 w-2.5 h-2.5 bg-purple-100 rounded-full animate-bounce opacity-15"></div>
            <div className="absolute top-72 left-1/3 w-2 h-2 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute top-80 right-1/4 w-1.5 h-1.5 bg-blue-100 rounded-full animate-pulse opacity-20"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-gray-900"
            >
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                Ready to <span className="text-shimmer">Start Trading?</span>
              </h2>
              <p className="text-lg lg:text-xl mb-10 text-gray-600">
                Join thousands of traders who trust COINSENSEI for their crypto needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild size="lg" variant="secondary" className="py-4 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-xl btn-glow">
                      <Link href="/dashboard">
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild size="lg" variant="secondary" className="py-4 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-xl btn-glow">
                        <Link href="/auth/signup">
                          Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild size="lg" className="py-4 px-8 text-lg btn-shimmer btn-glow shadow-xl font-semibold">
                        <Link href="/auth/login">Login to Trade</Link>
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-300 py-16 lg:py-20 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-10"></div>
          <div className="absolute top-20 right-20 w-0.5 h-0.5 bg-purple-400 rounded-full animate-ping opacity-15"></div>
          <div className="absolute top-40 left-1/4 w-1 h-1 bg-indigo-400 rounded-full animate-bounce opacity-10"></div>
          <div className="absolute top-60 right-1/3 w-0.5 h-0.5 bg-blue-400 rounded-full animate-pulse opacity-15"></div>
          <div className="absolute top-80 left-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-10"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Link href="/" className="mb-6 block">
                  <CoinsenseiLogo size="xl" showText={false} variant="white" />
                </Link>
                <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                  Pakistan's most trusted P2P crypto exchange platform. Trade USDT safely with multiple payment options including JazzCash, EasyPaisa, Bank Transfer & Raast.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                    🇵🇰 Made in Pakistan
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
                    🔒 Bank-Grade Security
                  </Badge>
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10">
                    ⚡ Instant Settlements
                  </Badge>
                </div>
              </motion.div>
            </div>
            
            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-blue-400" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/auth/signup", label: "Sign Up", icon: "🚀" },
                  { href: "/auth/login", label: "Login", icon: "🔐" },
                  { href: "/dashboard", label: "Dashboard", icon: "📊" },
                  { href: "/support", label: "Support", icon: "💬" }
                ].map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 group"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span className="text-sm group-hover:text-blue-400">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            {/* Legal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Legal & Security
              </h4>
              <ul className="space-y-3">
                {[
                  { href: "/terms", label: "Terms of Service", icon: "📋" },
                  { href: "/privacy", label: "Privacy Policy", icon: "🔒" },
                  { href: "/compliance", label: "Compliance", icon: "✅" },
                  { href: "/kyc", label: "KYC Policy", icon: "🆔" }
                ].map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 group"
                    >
                      <span className="text-sm">{link.icon}</span>
                      <span className="text-sm group-hover:text-blue-400">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="border-t border-gray-800/50 mt-16 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} COINSENSEI. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-400" />
                  Licensed in Pakistan
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-blue-400" />
                  SSL Secured
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </>
  );
}
