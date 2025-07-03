# P2P Express System

## Overview
The P2P Express system allows users to buy and sell USDT instantly using their PKR balance through admin-controlled rates. This is a fully automated system that provides immediate liquidity for users.

## Features

### User Features
- **Instant Buy/Sell**: Users can instantly buy USDT with PKR or sell USDT for PKR
- **Real-time Rates**: Live rates set by administrators
- **Balance Integration**: Uses existing `user_pkr_wallets` and `user_wallets` balances
- **Daily Limits**: Configurable daily trading limits per user
- **Order History**: Complete transaction history with status tracking
- **Mobile Responsive**: Full mobile support with modern UI

### Admin Features
- **Rate Management**: Set buy and sell rates in real-time
- **System Control**: Toggle system on/off with "Take a Break" functionality
- **Order Monitoring**: View all P2P Express orders with detailed analytics
- **Limit Configuration**: Set minimum/maximum order amounts and daily limits
- **Statistics Dashboard**: Track volumes, order counts, and system performance

## Database Schema

### Tables Created
1. **`p2p_express_config`** - System configuration and rates
2. **`p2p_express_orders`** - Order history and tracking
3. **`p2p_express_daily_limits`** - User daily limit tracking

### Key Functions
- `get_p2p_express_config()` - Get current rates and configuration
- `process_p2p_express_order()` - Process buy/sell orders atomically
- `get_user_daily_p2p_limits()` - Check user's daily usage
- `get_user_p2p_orders()` - Get user's order history

## API Endpoints

### User Endpoints
- `GET /api/user/p2p-express/config` - Get rates and user limits
- `POST /api/user/p2p-express/order` - Place buy/sell order
- `GET /api/user/p2p-express/order` - Get order history

### Admin Endpoints
- `GET /api/admin/p2p-express/config` - Get system configuration
- `PUT /api/admin/p2p-express/config` - Update rates and settings
- `GET /api/admin/p2p-express/orders` - Get all orders with statistics

## Pages Created

### User Pages
- `/user/p2p-express` - Main P2P Express interface
  - Rate display for buy/sell
  - Wallet balance overview
  - Order placement modal
  - Recent order history
  - Real-time validation

### Admin Pages
- `/admin/p2p-express` - P2P Express management
  - System status and control
  - Rate configuration
  - Order statistics
  - Recent orders monitoring

## Security Features

1. **Authentication**: All endpoints require valid user session
2. **KYC Check**: Only verified users can place orders
3. **Account Lock Check**: Locked accounts cannot trade
4. **Balance Validation**: Atomic balance checks before processing
5. **Rate Protection**: Orders fail if rates change during processing
6. **Daily Limits**: Configurable daily trading limits
7. **Audit Logging**: All admin actions are logged

## System Flow

### Buy USDT Process
1. User enters USDT amount to buy
2. System calculates PKR cost at current buy rate
3. Validates user has sufficient PKR balance
4. Checks daily buy limit
5. Atomically:
   - Deducts PKR from `user_pkr_wallets`
   - Credits USDT to `user_wallets`
   - Creates order record
   - Updates daily limits

### Sell USDT Process
1. User enters USDT amount to sell
2. System calculates PKR amount at current sell rate
3. Validates user has sufficient USDT balance
4. Checks daily sell limit
5. Atomically:
   - Deducts USDT from `user_wallets`
   - Credits PKR to `user_pkr_wallets`
   - Creates order record
   - Updates daily limits

## Configuration

### Default Settings
- Buy Rate: ₨275.00 per USDT
- Sell Rate: ₨270.00 per USDT
- Minimum Order: 100 USDT
- Maximum Order: 10,000 USDT
- Daily Buy Limit: 50,000 USDT
- Daily Sell Limit: 50,000 USDT
- System: Active

### Admin Controls
- **Take a Break**: Instantly disable the system
- **Rate Adjustment**: Real-time rate updates
- **Limit Management**: Adjust order and daily limits
- **Order Monitoring**: Track all trading activity

## Navigation Integration

### User Navigation
- Added "P2P Express" link to main user navigation
- Accessible from `/user/p2p-express`

### Admin Navigation
- Added to "Financial" section in admin navigation
- Accessible from `/admin/p2p-express`

## Database Migration

The system requires running the migration:
```sql
-- File: supabase/migrations/20241210000000_create_p2p_express_system.sql
```

This creates all necessary tables, functions, and initial configuration.

## Technical Implementation

### Frontend
- React with TypeScript
- Framer Motion animations
- Tailwind CSS styling
- Real-time validation
- Responsive design

### Backend
- Next.js API routes
- Supabase database functions
- Row Level Security (RLS)
- Atomic transactions
- Error handling

### Database
- PostgreSQL with Supabase
- ACID compliance
- Foreign key constraints
- Optimized indexes
- Audit trail

## Usage Examples

### User Experience
1. User visits `/user/p2p-express`
2. Sees current buy/sell rates
3. Views their PKR and USDT balances
4. Clicks "Buy USDT" or "Sell USDT"
5. Enters amount and confirms
6. Transaction processes instantly
7. Updated balances reflect immediately

### Admin Experience
1. Admin visits `/admin/p2p-express`
2. Views system status and statistics
3. Adjusts rates as needed
4. Monitors order activity
5. Can "Take a Break" to pause system

## Benefits

1. **Instant Liquidity**: Users get immediate access to USDT/PKR
2. **Automated**: No manual intervention required
3. **Transparent**: Clear rates and limits
4. **Secure**: Multiple validation layers
5. **Scalable**: Handles high volume efficiently
6. **Manageable**: Full admin control and monitoring

This P2P Express system provides a complete solution for instant USDT/PKR trading with full administrative control and user-friendly interfaces. 