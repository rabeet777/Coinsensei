# PKR Transfer System

## Overview
The PKR Transfer System allows users to send Pakistani Rupees (PKR) to other CoinSensei users instantly using unique PKR addresses. This feature enables peer-to-peer transactions within the platform.

## Features

### 1. Unique PKR Addresses
- Each user gets a unique PKR address (format: PKRXXXXXXXX)
- Addresses are automatically generated for existing PKR wallets (wallets are created during user signup)
- Format: `PKR` + 8 characters from user ID + 6-digit timestamp suffix
- Addresses are stored in the `address` column of existing `user_pkr_wallets` table

### 2. Transfer Page (`/user/transfer/pkr`)
- **Balance Display**: Shows user's current PKR balance and their unique address
- **Recipient Lookup**: Enter recipient's PKR address to find the user
- **Amount Input**: Specify transfer amount (minimum ₨100)
- **Notes**: Optional message for the transfer
- **Transfer Preview**: Shows breakdown of the transaction
- **Security Verification**: Uses existing SecurityVerification component
- **Real-time Validation**: Checks balance, addresses, and account status

### 3. Transfer API (`/api/user/transfer/pkr`)
- **Authentication**: Validates user session
- **Input Validation**: Ensures proper amount, addresses, and user status
- **Balance Checks**: Verifies sufficient funds
- **Address Validation**: Confirms recipient exists and account is active
- **Database Transaction**: Uses atomic operations to ensure data consistency
- **Transfer Logging**: Records all transfers in `user_pkr_transfers` table

## Database Schema

### New Tables

#### `user_pkr_transfers`
```sql
CREATE TABLE user_pkr_transfers (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modified Tables

#### `user_pkr_wallets` (existing table)
- Added `address VARCHAR(50) UNIQUE` column to existing wallet structure
- Index created for fast address lookups
- Wallets already exist from user signup, just adding address functionality

## Database Functions

### `transfer_pkr(sender_id, recipient_id, amount, notes)`
- Performs atomic PKR transfer between users
- Validates balances and user status
- Updates wallet balances
- Creates transfer record
- Returns transfer ID

### `generate_pkr_address(user_id)`
- Generates unique PKR address for a user
- Ensures no address conflicts
- Format: PKR + user_id_prefix + timestamp

### `ensure_user_pkr_address(user_id)`
- Ensures existing PKR wallet has an address
- Generates address if missing (wallets already exist from signup)
- Returns user's PKR address

### `get_user_pkr_transfers(user_id, limit)`
- Returns user's transfer history
- Shows both sent and received transfers
- Includes other party information

## Security Features

1. **Row Level Security (RLS)**: Users can only view their own transfers
2. **Account Lock Checks**: Prevents transfers from/to locked accounts
3. **Balance Validation**: Ensures sufficient funds before transfer
4. **Address Verification**: Validates recipient exists
5. **Transaction Logging**: All transfers are recorded for audit

## User Interface

### Dashboard Integration
- Added "Transfer PKR" button to PKR wallet card
- Grid layout with Deposit, Withdraw, and Transfer options

### Transfer Page Features
- **Progress Steps**: Form → Security → Confirmation
- **Real-time Validation**: Address lookup and balance checks
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Clear error messages and validation
- **Loading States**: Smooth user experience during operations

## API Endpoints

### `POST /api/user/transfer/pkr`
**Request Body:**
```json
{
  "recipientAddress": "PKRXXXXXXXX",
  "amount": 1000,
  "notes": "Optional transfer note"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transferId": "uuid",
  "newBalance": 5000,
  "details": {
    "amount": 1000,
    "recipientAddress": "PKRXXXXXXXX",
    "notes": "Optional transfer note",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Setup Instructions

1. **Run SQL Migration:**
   ```bash
   # Execute the SQL file to set up tables and functions
   psql -d your_database -f sql/add_pkr_transfer_system.sql
   ```

2. **Test the System:**
   - Create multiple user accounts
   - Check that PKR addresses are generated
   - Test transfers between users
   - Verify transfer history

## Current Status

The PKR transfer system is fully implemented but currently shows as "Coming Soon" in the UI. To activate:

1. Remove the "Feature In Development" warning
2. Enable the transfer form submission
3. Test thoroughly in development environment
4. Deploy to production

## Future Enhancements

1. **Transfer Limits**: Daily/monthly transfer limits
2. **Transfer Fees**: Configurable transfer fees
3. **Transfer Schedules**: Scheduled transfers
4. **QR Codes**: Generate QR codes for PKR addresses
5. **Notifications**: Email/SMS notifications for transfers
6. **Transfer History**: Enhanced filtering and search
7. **Bulk Transfers**: Send to multiple recipients
8. **Address Book**: Save frequently used addresses

## Files Created/Modified

### New Files:
- `src/app/user/transfer/pkr/page.tsx` - Transfer page
- `src/app/api/user/transfer/pkr/route.ts` - Transfer API
- `sql/add_pkr_transfer_system.sql` - Database migration

### Modified Files:
- `src/app/user/dashboard/page.tsx` - Added transfer button

## Testing Checklist

- [ ] PKR addresses are generated for new users
- [ ] Transfer form validation works correctly
- [ ] Recipient lookup finds valid addresses
- [ ] Balance checks prevent overdrafts
- [ ] Locked accounts cannot send/receive
- [ ] Transfer history is recorded correctly
- [ ] Security verification works
- [ ] Error handling displays properly
- [ ] Responsive design works on mobile

The PKR transfer system provides a complete peer-to-peer payment solution within your CoinSensei platform, enabling users to send PKR instantly using unique addresses. 