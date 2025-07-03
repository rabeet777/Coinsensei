# 🚀 Worker Management System Setup Guide

## 📋 Database Setup Instructions

Follow these steps **in order** to set up your database for the new worker management system:

### 1. **System Configuration Table**
```sql
-- Run this first in Supabase SQL Editor
\i sql/create_system_config_table.sql
```

### 2. **Admin Actions Logging**
```sql
-- Run this second
\i sql/create_admin_actions_table.sql
```

### 3. **Job Queue System**
```sql
-- Run this third
\i sql/create_job_logs_table.sql
```

### 4. **Worker System Columns**
```sql
-- Run this fourth - adds required columns to user_wallets
\i sql/add_worker_system_columns.sql
```

### 5. **Foreign Key Relationships**
```sql
-- Run this last - establishes proper relationships
\i sql/create_foreign_key_relationships.sql
```

---

## 🎯 Features Overview

### **Admin Worker Management Dashboard**
- **Real-time System Monitoring** - Live worker status and performance metrics
- **Job Queue Management** - Manual job dispatch to specific wallets
- **System Controls** - Start/pause workers, clear failed jobs, reset stuck states
- **Professional UI** - Enterprise-grade interface matching major exchanges

### **Job Types Supported**
1. **🔄 Wallet Sync** - Balance and transaction synchronization
2. **🔀 Consolidation** - Combine wallet funds for efficiency
3. **⛽ Gas Topup** - Add TRX for transaction fees

### **Worker Control Features**
- ✅ **Start/Pause System** - Full worker lifecycle management
- ✅ **Real-time Monitoring** - Live system health and performance
- ✅ **Manual Job Dispatch** - Queue jobs to specific wallets
- ✅ **Error Recovery** - Clear failed jobs and reset stuck states
- ✅ **Audit Trail** - Complete logging of all admin actions

---

## 🔧 API Endpoints

### **Worker Control**
```typescript
POST /api/admin/workers/control
// Start or pause the entire worker system
{ "action": "start" | "pause" }
```

### **Job Dispatch**
```typescript
POST /api/admin/dispatch-job
// Queue a job to a specific wallet
{
  "walletId": "uuid",
  "userId": "uuid", 
  "address": "TRX_address",
  "jobType": "consolidation" | "gas-topup"
}
```

### **System Maintenance**
```typescript
POST /api/admin/jobs/clear-failed
// Clear all failed jobs from queue

POST /api/admin/reset-processing
// Reset stuck processing states
```

### **System Statistics**
```typescript
GET /api/workers/stats
// Get real-time worker and job statistics
```

---

## 📊 Database Schema

### **job_logs Table**
```sql
CREATE TABLE job_logs (
  id UUID PRIMARY KEY,
  job_id TEXT UNIQUE,
  job_type TEXT CHECK (job_type IN ('sync', 'consolidation', 'gas-topup')),
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  wallet_address TEXT,
  user_id UUID REFERENCES auth.users(id),
  data JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **admin_actions Table**
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id),
  action_type TEXT,
  target_id TEXT,
  target_type TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **system_config Table**
```sql
CREATE TABLE system_config (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE,
  value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Usage Instructions

### **1. Accessing the Worker Dashboard**
Navigate to `/admin/workers` in your admin panel

### **2. Starting the System**
1. Click **"Start Workers"** button
2. System status will change to "Healthy"
3. Workers will begin processing queued jobs

### **3. Queuing Jobs to Wallets**
1. Click **"Queue Job"** button
2. Select job type:
   - **Consolidation**: Combine wallet funds
   - **Gas Topup**: Add TRX for transaction fees
3. Search for target wallet by address or user name
4. Select wallet and confirm dispatch

### **4. Monitoring System Health**
- **Green badges** = System operating normally
- **Yellow badges** = Warning - attention needed
- **Red badges** = Error - immediate action required

### **5. Troubleshooting**
- **Clear Failed Jobs**: Remove failed jobs from queue
- **Reset Processing States**: Fix wallets stuck in processing
- **Pause System**: Emergency stop for maintenance

---

## 🔒 Security Features

### **Admin-Only Access**
- Role-based authentication required
- Session validation on all endpoints
- Row Level Security (RLS) on all tables

### **Audit Trail**
- All admin actions logged with timestamps
- Job dispatch history maintained
- System state changes tracked

### **Data Protection**
- Foreign key constraints ensure data integrity
- Automatic cleanup of orphaned records
- Proper indexing for performance

---

## 🚦 System Status Indicators

| Status | Meaning | Action Required |
|--------|---------|----------------|
| 🟢 **Healthy** | All systems operational | None |
| 🟡 **Degraded** | Some issues detected | Monitor closely |
| 🔴 **Down** | Critical errors | Immediate intervention |

### **Worker States**
- **Active**: Currently processing jobs
- **Idle**: Waiting for jobs, ready to work
- **Paused**: Manually stopped
- **Error**: Requires admin attention

---

## 📈 Performance Optimization

### **Batch Processing**
- Jobs processed in efficient batches
- Automatic retry with exponential backoff
- Dead letter queue for persistent failures

### **Database Optimization**
- Comprehensive indexing strategy
- Foreign key relationships for data integrity
- Automatic timestamp triggers

### **Real-time Updates**
- Live dashboard updates every 15 seconds
- WebSocket support for instant notifications
- Efficient query patterns for scalability

---

## 🔄 Production Deployment

### **PM2 Integration**
The system integrates with PM2 for production worker management:

```bash
# Start workers
pm2 start wallet-workers

# Stop workers  
pm2 stop wallet-workers

# Restart workers
pm2 restart wallet-workers
```

### **Environment Variables**
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### **Health Checks**
- Automatic worker health monitoring
- Failed job cleanup scheduling
- System performance metrics

---

## 🎉 Success!

Your worker management system is now ready for production use! The system provides:

✅ **Enterprise-grade job queue management**  
✅ **Real-time monitoring and control**  
✅ **Professional admin interface**  
✅ **Complete audit trail and security**  
✅ **Scalable architecture for growth**

For support or additional features, refer to the API documentation or contact your development team. 