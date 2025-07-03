# CoinSensei - Cryptocurrency Exchange Platform

**CoinSensei** is a comprehensive cryptocurrency exchange platform built with Next.js 15, TypeScript, Supabase, and modern web technologies. It features PKR/USDT trading, secure user management, admin controls, and advanced security systems.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Redis, BullMQ
- **Authentication**: Supabase Auth with multi-factor authentication
- **Real-time**: Socket.IO for live trading data
- **Queue System**: BullMQ with Redis for background jobs
- **Security**: TOTP, SMS, Email verification, KYC system

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Next.js API    │───▶│    Supabase     │
│  (React/TS)     │    │   Routes         │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │     Redis       │              │
         │              │  (Queue/Cache)  │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Socket.IO     │                            │  Worker System  │
│ (Real-time)     │                            │ (Background)    │
└─────────────────┘                            └─────────────────┘
```

## 📁 Project Structure

```
coinsensei/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── admin/                    # Admin Dashboard
│   │   │   ├── dashboard/            # Admin overview
│   │   │   ├── users/                # User management
│   │   │   ├── trades/               # Trade management
│   │   │   ├── workers/              # Background job management
│   │   │   ├── usdt-withdrawals/     # Withdrawal management
│   │   │   └── ...                   # Other admin features
│   │   ├── user/                     # User Dashboard
│   │   │   ├── dashboard/            # User overview
│   │   │   ├── trade/                # Trading interface
│   │   │   ├── transfer/pkr/         # PKR transfers
│   │   │   ├── security/             # Security settings
│   │   │   └── ...                   # Other user features
│   │   ├── auth/                     # Authentication pages
│   │   └── api/                      # API routes
│   ├── components/                   # Reusable UI components
│   │   ├── admin/                    # Admin-specific components
│   │   ├── ui/                       # Base UI components (shadcn)
│   │   ├── SecurityGuard.tsx         # Multi-factor auth guard
│   │   ├── RequireKYC.tsx           # KYC verification guard
│   │   └── ...                       # Other components
│   ├── lib/                          # Utilities and configurations
│   ├── services/                     # Business logic services
│   ├── worker/                       # Background worker processes
│   └── types/                        # TypeScript type definitions
├── supabase/migrations/              # Database migrations
├── workers/                          # Worker implementations
├── cron/                             # Cron job scripts
└── docs/                            # Additional documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Redis server
- Supabase project
- Twilio account (for SMS)
- SMTP service (for emails)

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation & Setup
```bash
# Clone repository
git clone <repository-url>
cd coinsensei

# Install dependencies
npm install

# Set up database migrations
npm run supabase:db:push

# Start development servers
npm run dev              # Next.js development server
npm run dev:socket       # Socket.IO server
npm run worker:all       # All background workers
npm run cron:all         # All cron jobs
```

## 💎 Core Features

### 🔐 Authentication & Security
- **Multi-Factor Authentication**: TOTP, SMS, Email verification
- **KYC Verification**: Document upload and admin approval system
- **Security Guards**: Component-level protection for sensitive operations
- **Account Recovery**: Secure password reset with multi-factor verification
- **Session Management**: Secure session handling with middleware protection

**Key Components:**
- `SecurityGuard.tsx` - MFA verification component
- `RequireKYC.tsx` - KYC status verification
- `SecurityVerification.tsx` - Security challenge component

### 📊 Trading System
- **Real-time Trading**: PKR/USDT pairs with live order book
- **Order Management**: Place, cancel, track orders with partial fills
- **Fee System**: 0.15% trading fees with transparent calculation
- **Trade History**: Comprehensive trade tracking and analytics
- **Socket Integration**: Real-time price updates and order book changes

**Key Files:**
- `src/app/user/trade/page.tsx` - Trading interface
- `src/services/tradeService.ts` - Trading logic and order matching
- `src/components/OrderBook.tsx` - Live order book display
- `src/components/TradeHistory.tsx` - Trade history component

### 💸 PKR Transfer System
- **User-to-User Transfers**: Send PKR between CoinSensei users
- **Address System**: Unique numeric PKR addresses (e.g., 4465001040)
- **Security Verification**: Multi-factor auth required for transfers
- **Transfer History**: Complete transaction history with filtering
- **Real-time Validation**: Instant recipient verification

**Key Files:**
- `src/app/user/transfer/pkr/page.tsx` - Transfer interface
- `src/app/user/transfer/pkr/history/page.tsx` - Transfer history
- `src/app/api/user/transfer/pkr/route.ts` - Transfer API
- Database function: `transfer_pkr()` for atomic transactions

### 👑 Admin Dashboard
- **User Management**: View, manage, suspend user accounts
- **Trade Oversight**: Monitor all trading activity and statistics
- **Worker Management**: Control background job processing
- **System Health**: Monitor system performance and job queues
- **Financial Controls**: Manage withdrawals and platform fees

**Key Features:**
- Real-time statistics and metrics
- Advanced filtering and search capabilities
- Bulk operations for user management
- System configuration management
- Audit trail for all admin actions

### ⚙️ Background Worker System
- **Wallet Sync**: Automatic balance synchronization
- **Gas Management**: TRX top-ups for transaction fees
- **Consolidation**: Automatic USDT collection to admin wallets
- **Queue Management**: BullMQ-based job processing with Redis
- **Health Monitoring**: Job status tracking and error handling

**Worker Types:**
- `sync-balances.worker.ts` - Balance synchronization
- `gas-topup.worker.ts` - TRX gas management
- `consolidation.worker.ts` - Asset consolidation

## 🔧 API Documentation

### Authentication APIs
```typescript
POST /auth/login          // User login with MFA
POST /auth/signup         // User registration
POST /auth/forgot-password // Password reset flow
GET  /auth/verify         // Email verification
```

### Trading APIs
```typescript
POST /api/placeOrder      // Place buy/sell orders
POST /api/cancelOrder     // Cancel pending orders
GET  /api/getUserOrders   // Fetch user's orders
GET  /api/getUserTrades   // Fetch user's trade history
GET  /api/getOrderBook    // Current order book data
```

### Transfer APIs
```typescript
POST /api/user/transfer/pkr         // Execute PKR transfer
GET  /api/user/transfer/pkr/history // Transfer history
```

### Security APIs
```typescript
POST /api/security/verify-totp      // TOTP verification
POST /api/security/setup-totp       // TOTP setup
POST /api/sms/send                  // Send SMS code
POST /api/sms/verify                // Verify SMS code
```

### Admin APIs
```typescript
GET  /api/admin/users               // User management
GET  /api/admin/trades              // Trade monitoring
POST /api/admin/dispatch-job        // Queue background jobs
GET  /api/admin/workers/stats       // System statistics
```

## 🗄️ Database Schema

### Core Tables
- **`user_profile`** - User information and KYC status
- **`user_security`** - Security settings (TOTP, SMS, Email)
- **`user_pkr_wallets`** - PKR wallet balances and addresses
- **`user_wallets`** - USDT wallet balances
- **`orders`** - Trading orders
- **`trades`** - Executed trades with details
- **`user_pkr_transfers`** - PKR transfer records
- **`job_logs`** - Background job tracking

### Key Functions
- **`transfer_pkr()`** - Atomic PKR transfers between users
- **`match_orders_rpc()`** - Order matching for trading
- **`get_user_pkr_transfers()`** - Transfer history retrieval

## 🔒 Security Features

### Multi-Factor Authentication
- **TOTP**: Authenticator app support (Google Authenticator, Authy)
- **SMS**: Twilio-based SMS verification
- **Email**: Supabase-based email verification
- **Recovery**: Live photo verification for account recovery

### KYC Verification
- Document upload and verification
- Admin approval workflow
- Status tracking (pending, approved, rejected)
- Required for sensitive operations

### Protection Guards
- Route-level authentication middleware
- Component-level security guards
- Role-based access control (admin/user)
- Session validation and refresh

## 🔄 Background Processing

### Job Types
1. **Balance Sync** - Updates wallet balances from blockchain
2. **Gas Top-up** - Ensures wallets have sufficient TRX for fees
3. **Consolidation** - Moves assets to admin wallets
4. **Order Processing** - Handles trade execution

### Queue Management
- Redis-based job queues with BullMQ
- Automatic retry with exponential backoff
- Job prioritization and rate limiting
- Dead letter queue for failed jobs

### Monitoring
- Real-time job status tracking
- Performance metrics and statistics
- Error logging and alerting
- Admin dashboard for queue management

## 🚦 System Commands

### Development
```bash
npm run dev              # Start development server
npm run dev:socket       # Start Socket.IO server
npm run build           # Build for production
npm run start           # Start production server
```

### Workers
```bash
npm run worker:all                 # Start all workers
npm run worker:new-sync-balances   # Balance sync worker
npm run worker:new-gas-topup       # Gas management worker
npm run worker:new-consolidation   # Consolidation worker
```

### Cron Jobs
```bash
npm run cron:all           # Start all cron jobs
npm run cron:balance-sync  # Balance sync cron
npm run cron:cleanup       # Cleanup stuck jobs
npm run cron:queue-jobs    # Queue dependent jobs
```

### System Management
```bash
npm run system:start      # Start complete system (workers + cron)
```

## 📝 Usage Guide

### For Users
1. **Registration**: Sign up with email verification
2. **KYC**: Complete identity verification
3. **Security**: Set up 2FA (TOTP/SMS)
4. **Trading**: Buy/sell USDT with PKR
5. **Transfers**: Send PKR to other users
6. **History**: Track all transactions and trades

### For Admins
1. **Dashboard**: Monitor system health and statistics
2. **Users**: Manage user accounts and KYC approvals
3. **Trading**: Oversee trading activity and resolve issues
4. **Workers**: Control background job processing
5. **System**: Configure platform settings and fees

## 🛡️ Security Best Practices

1. **Environment Security**: Keep sensitive environment variables secure
2. **Database Access**: Use service role keys only for server-side operations
3. **API Protection**: Implement rate limiting and input validation
4. **Session Management**: Regular session rotation and validation
5. **Multi-Factor Auth**: Enforce MFA for all sensitive operations
6. **Audit Logging**: Track all admin actions and critical operations

## 🔧 Troubleshooting

### Common Issues
1. **Queue Stuck**: Use cleanup cron jobs or manual reset
2. **Balance Sync**: Check worker logs and blockchain connectivity
3. **Trading Issues**: Verify order book and matching engine status
4. **Authentication**: Check security method configuration

### Monitoring
- Check admin dashboard for system health
- Monitor job queue status and error rates
- Review audit logs for suspicious activity
- Track user authentication success rates

## 📚 Additional Documentation

- [Worker System Setup](docs/worker-system-setup.md)
- [Admin Dashboard Guide](WORKER_DASHBOARD_README.md)
- [Trade Management](TRADE_MANAGEMENT_SETUP.md)
- [Security Configuration](ADMIN_SECURITY_FIXES.md)
- [PKR Transfer System](PKR_TRANSFER_SYSTEM.md)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Implement proper error handling
3. Add comprehensive logging
4. Include unit tests for critical functions
5. Update documentation for new features

## 📞 Support

For technical issues or questions:
1. Check the troubleshooting section
2. Review system logs and job queues
3. Monitor admin dashboard for alerts
4. Contact development team with detailed error information

---

**CoinSensei** - Building the future of cryptocurrency trading in Pakistan 🇵🇰
