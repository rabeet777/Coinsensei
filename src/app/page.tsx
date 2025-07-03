// src/app/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoinsenseiLogo } from '@/components/ui/coinsensei-logo';
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
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

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
    initial: { opacity: 0, y: 60 },
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

      {/* Header */}
      <header className="w-full px-6 py-4 shadow bg-white/95 backdrop-blur-sm fixed top-0 z-50 flex justify-between items-center border-b">
        <Link href="/">
          <CoinsenseiLogo size="lg" />
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/#features" className="hover:text-blue-600 transition-colors">
            Features
          </Link>
          <Link href="/#payment-methods" className="hover:text-blue-600 transition-colors">
            Payment Methods
          </Link>
          <Link href="/#security" className="hover:text-blue-600 transition-colors">
            Security
          </Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">
            How It Works
          </Link>
          {user ? (
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <div className="flex gap-3">
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Login
          </Link>
              <Button asChild size="sm">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </header>

      <main className="pt-20">
          {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="flex justify-center mb-6">
                <Badge variant="secondary" className="px-4 py-2 text-blue-600 bg-blue-100">
                  🚀 Pakistan's Most Trusted P2P Platform
                </Badge>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Trade Crypto
                </span>
                <br />
                <span className="text-gray-900">The Smart Way</span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Experience seamless P2P crypto trading with instant PKR settlements through 
                <span className="font-semibold text-blue-600"> JazzCash, EasyPaisa, Bank Transfer & Raast</span>
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
              >
                {user ? (
                  <Button asChild size="lg" className="py-4 px-8 text-lg">
                    <Link href="/dashboard">
                      Go to Trading <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="py-4 px-8 text-lg">
                      <Link href="/auth/signup">
                        Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="py-4 px-8 text-lg">
                      <Link href="#how-it-works">Learn How</Link>
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>50,000+ Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>₨2B+ Monthly Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Bank-Grade Security</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section id="payment-methods" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Payment Solutions</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Multiple <span className="text-blue-600">Payment Options</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Trade with your preferred payment method. Instant settlements and competitive rates guaranteed.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                <motion.div key={method.name} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                    <CardHeader>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <method.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{method.name}</CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {method.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {feature}
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
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Platform Features</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Why Choose <span className="text-blue-600">COINSENSEI</span>?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of P2P crypto trading with our advanced features and unmatched security.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                        <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
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
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Simple Process</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Start Trading in <span className="text-blue-600">3 Easy Steps</span>
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
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
                <motion.div key={step.step} variants={fadeInUp} className="text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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
        <section id="security" className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 bg-white/10 text-white">Maximum Security</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Your Security is Our <span className="text-blue-400">Priority</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Advanced security measures protect your assets and personal information at every step.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Lock,
                  title: "256-bit Encryption",
                  description: "Military-grade encryption protects all your data and transactions"
                },
                {
                  icon: Shield,
                  title: "Cold Storage",
                  description: "99% of funds stored offline in secure, insured cold wallets"
                },
                {
                  icon: Eye,
                  title: "2FA Authentication",
                  description: "Two-factor authentication adds an extra layer of account security"
                },
                {
                  icon: UserCheck,
                  title: "KYC Verification",
                  description: "Identity verification ensures a trusted trading community"
                },
                {
                  icon: Blocks,
                  title: "Smart Escrow",
                  description: "Automated escrow system protects both buyers and sellers"
                },
                {
                  icon: Globe,
                  title: "Regulatory Compliance",
                  description: "Full compliance with Pakistani financial regulations and laws"
                }
              ].map((security, index) => (
                <motion.div key={security.title} variants={fadeInUp}>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                      <security.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{security.title}</h3>
                    <p className="text-gray-300">{security.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="text-white">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Start Trading?
              </h2>
              <p className="text-xl mb-10 opacity-90">
                Join thousands of traders who trust COINSENSEI for their crypto needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                  <Button asChild size="lg" variant="secondary" className="py-4 px-8 text-lg">
                  <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                    <Button asChild size="lg" variant="secondary" className="py-4 px-8 text-lg">
                    <Link href="/auth/signup">
                        Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                    <Button asChild size="lg" variant="outline" className="py-4 px-8 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                      <Link href="/auth/login">Login to Trade</Link>
                  </Button>
                </>
              )}
              </div>
            </motion.div>
        </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4 block">
                COINSENSEI
              </Link>
              <p className="text-gray-400 mb-4 max-w-md">
                Pakistan's most trusted P2P crypto exchange platform. Trade USDT safely with multiple payment options.
              </p>
              <div className="flex gap-4">
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  🇵🇰 Made in Pakistan
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/compliance" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} COINSENSEI. All rights reserved. | Licensed and regulated in Pakistan.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
