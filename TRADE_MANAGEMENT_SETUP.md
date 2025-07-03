# Trade Management System Documentation

## 🎯 Overview

This document outlines the comprehensive trade management system implemented for the CoinSensei platform. The system tracks executed trades between users and provides robust admin and user interfaces for monitoring trading activity.

## 📊 Database Schema

### Trades Table
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_order_id UUID NOT NULL REFERENCES orders(id),
    seller_order_id UUID NOT NULL REFERENCES orders(id),
    buyer_user_id UUID NOT NULL REFERENCES auth.users(id),
    seller_user_id UUID NOT NULL REFERENCES auth.users(id),
    trade_amount DECIMAL(20, 8) NOT NULL,         -- Amount of USDT traded
    trade_price DECIMAL(20, 8) NOT NULL,          -- Price per USDT in PKR
    total_value DECIMAL(20, 8) NOT NULL,          -- trade_amount * trade_price (PKR value)
    buyer_fee DECIMAL(20, 8) NOT NULL DEFAULT 0,  -- Fee paid by buyer (USDT)
    seller_fee DECIMAL(20, 8) NOT NULL DEFAULT 0, -- Fee paid by seller (USDT equivalent)
    platform_fee_total DECIMAL(20, 8) NOT NULL DEFAULT 0,
    trade_status VARCHAR(20) NOT NULL DEFAULT 'completed',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Views
- **`admin_trades_view`**: Comprehensive view for admin management with user details
- **`user_trades_view`**: User-specific view with role-based data filtering

## 🔧 API Endpoints

### Admin APIs

#### GET `/api/admin/trades`
**Purpose**: Fetch all trades with comprehensive filtering and statistics

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Number of records per page
- `status` (string): Filter by trade status
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort direction (asc/desc)

**Response:**
```json
{
  "trades": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "stats": {
    "total_trades": 100,
    "total_volume_usdt": 10000,
    "total_volume_pkr": 2800000,
    "total_fees_collected": 50
  }
}
```

#### GET `/api/admin/orders`
**Purpose**: Fetch all orders with user information and statistics

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by order status (pending/executed/cancelled)
- `type`: Filter by order type (buy/sell)
- `userId`: Filter by specific user
- `startDate`, `endDate`: Date range filters
- `sortBy`, `sortOrder`: Sorting options

### User APIs

#### GET `/api/getUserTrades`
**Purpose**: Fetch user's own trade history

**Query Parameters:**
- `user_id` (required): User ID
- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date filters

**Response:**
```json
{
  "trades": [...],
  "pagination": {...},
  "stats": {
    "total_trades": 10,
    "total_volume_usdt": 1000,
    "total_volume_pkr": 280000,
    "total_fees_paid": 5
  }
}
```

## 🎨 Frontend Components

### Admin Dashboards

#### `/admin/trades` - Trade Management Dashboard
**Features:**
- 📊 Real-time statistics cards
- 🔍 Advanced filtering and sorting
- 📄 Pagination support
- 📁 CSV export functionality
- 📱 Responsive design with animations

**Key Statistics:**
- Total trades count
- Trading volume (USDT & PKR)
- Platform fees collected
- Trade status breakdown

#### `/admin/orders` - Order Management Dashboard
**Features:**
- 📋 Comprehensive order listing
- 👤 User information display
- 📈 Order progress tracking
- 🔄 Status management
- 📊 Order statistics

### User Components

#### `TradeHistory.tsx` - User Trade History
**Features:**
- 📖 Personal trade history
- 📊 User trading statistics
- 🔍 Date range filtering
- 📱 Mobile-responsive design
- 🎯 Role-based data display (buyer/seller perspective)

## ⚡ Real-time Updates

### Socket.IO Integration
The system includes real-time order book updates when trades are executed:

```typescript
// Trade recording with real-time updates
await recordTrade(buyerOrderId, sellerOrderId, ...tradeData)
const book = await fetchCurrentOrderBook()
emitOrderBook(book) // Broadcasts to all connected clients
```

### Updated APIs
- **`placeOrder`**: Now emits immediate socket updates
- **`cancelOrder`**: Now emits immediate socket updates
- **Trade execution**: Automatically records trades and updates order book

## 🏃 How to Run

### Single Server Setup (Recommended)
```bash
npm run dev:socket
```

This command:
- ✅ Starts Next.js on port 3000
- ✅ Starts Socket.IO on the same port
- ✅ Loads order watcher and matcher workers
- ✅ Enables real-time order book updates

### Key Benefits:
1. **Unified server**: No port conflicts
2. **Real-time updates**: Instant order book refreshes
3. **Trade tracking**: Complete audit trail
4. **Admin oversight**: Comprehensive management tools
5. **User transparency**: Personal trade history

## 📈 Trade Flow Process

1. **Order Placement**: User places buy/sell order
2. **Order Matching**: System finds matching orders
3. **Trade Execution**: Orders are matched and executed
4. **Trade Recording**: Complete trade details saved to database
5. **Balance Updates**: User balances updated
6. **Fee Collection**: Platform fees calculated and collected
7. **Real-time Broadcast**: Order book updated via Socket.IO
8. **Notifications**: Users notified of trade completion

## 🔐 Security Features

- **User Authentication**: All APIs require proper authentication
- **Role-based Access**: Admin vs user permissions
- **Data Isolation**: Users only see their own trade data
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API rate limiting (if configured)

## 📊 Monitoring & Analytics

### Admin Analytics
- Total platform volume
- Trading activity trends
- User trading patterns
- Fee collection tracking
- Order success rates

### User Analytics
- Personal trading volume
- Average trade sizes
- Fee costs analysis
- Trading frequency
- Profit/loss tracking

## 🚀 Next Steps

1. **Dispute Management**: Add trade dispute resolution system
2. **Advanced Analytics**: More detailed reporting and charts
3. **Email Notifications**: Trade confirmation emails
4. **Mobile App**: Mobile application with trade history
5. **API Rate Limiting**: Implement proper rate limiting
6. **Audit Logs**: Additional logging for compliance

## 📝 Database Maintenance

### Regular Tasks
- Archive old trades (optional)
- Index optimization
- Performance monitoring
- Backup strategies
- Data integrity checks

### Performance Optimizations
- Database indexing implemented
- View-based queries for efficiency
- Pagination to handle large datasets
- Caching strategies for frequently accessed data

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**

The trade management system is now live and ready for production use with comprehensive admin and user interfaces, real-time updates, and robust data tracking. 