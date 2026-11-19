# MongoDB Atlas Free Tier Setup Guide

## Creating a Free M0 Cluster

### Step 1: Create MongoDB Atlas Account
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google
3. Verify email address

### Step 2: Create a New Cluster (Free Tier)
1. Click "Build a Cluster"
2. **Cloud Provider & Region**: Choose closest to you
3. **Cluster Tier**: Select **M0 Sandbox** (FREE)
4. **Replica Set**: Keep default
5. Click "Create Cluster" (may take 1-2 minutes)

### Step 3: Set Up Database Access
1. In Atlas Dashboard → **Database Access**
2. Click "Add New Database User"
3. Username: `rohru_admin`
4. Password: Use a strong password (save this securely!)
5. Database Privileges: Read and write to any database
6. Click "Add User"

### Step 4: Configure Network Access
1. In Atlas Dashboard → **Network Access**
2. Click "Add IP Address"
3. Enter: `0.0.0.0/0` (allow all IPs - for development/testing)
   - For security, later restrict to Render's IP ranges
4. Click "Confirm"

### Step 5: Get Connection String
1. In Atlas Dashboard → **Clusters** → Connect
2. Choose "Connect your application"
3. Driver: "Python" → Version: "3.0 or later"
4. Copy the connection string:
```
mongodb+srv://<username>:<password>@cluster-xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Replace `<username>` and `<password>` with your credentials:
```
mongodb+srv://rohru_admin:YOUR_PASSWORD@rohru-cluster.mongodb.net/?retryWrites=true&w=majority
```

### Step 6: Create Database
1. Connection string format: `mongodb+srv://host/dbname?options`
2. Database name: `roaming_from_rohru`
3. Full connection string becomes:
```
mongodb+srv://rohru_admin:YOUR_PASSWORD@rohru-cluster.mongodb.net/roaming_from_rohru?retryWrites=true&w=majority
```

## Connection String for Render Environment

Add this as `MONGO_URL` in Render:
```
mongodb+srv://rohru_admin:YOUR_PASSWORD@rohru-cluster.mongodb.net/?retryWrites=true&w=majority
```

Then separately add `DB_NAME`:
```
roaming_from_rohru
```

## Data Migration (If Needed)

To migrate existing local data:

```bash
# Install pymongo if not already
pip install pymongo

# Run migration script
python << 'EOF'
import pymongo
import os

# Local connection
local_client = pymongo.MongoClient("mongodb://localhost:27017/")
local_db = local_client["roaming_from_rohru"]

# Atlas connection
atlas_url = "mongodb+srv://rohru_admin:YOUR_PASSWORD@rohru-cluster.mongodb.net/"
atlas_client = pymongo.MongoClient(atlas_url)
atlas_db = atlas_client["roaming_from_rohru"]

collections = ["explore", "events", "bookings", "messages", "waitlist", "settings", "users", "user_sessions"]

for coll in collections:
    if local_db[coll].count_documents({}) > 0:
        docs = list(local_db[coll].find({}))
        if docs:
            atlas_db[coll].delete_many({})  # Clear existing
            atlas_db[coll].insert_many(docs)
            print(f"Migrated {len(docs)} documents to {coll}")

print("Migration complete!")
EOF
```

## Free Tier Limits

| Resource | Free Limit |
|----------|------------|
| Storage | 512 MB |
| RAM | 512 MB |
| Connections | 100 |
| Monthly Ops | 10 million |
| Backups | Daily snapshots |

## Security Best Practices

1. **Never commit credentials** - Always use environment variables
2. **Restrict IP access** - In production, limit to Render's IP ranges
3. **Use strong passwords** - Rotate credentials periodically
4. **Enable WAF** - Atlas Web Application Firewall (available on higher tiers)
5. **Monitor usage** - Atlas dashboard shows usage metrics

## Troubleshooting

### Connection Error: "auth failed"
- Verify username/password
- Check if "roaming_from_rohru" database name is in `DB_NAME` env var

### Connection Error: "timeout"
- Verify IP whitelist accepts your IP
- Check network connectivity

### Connection Error: "SSL"
- Atlas uses TLS by default - ensure your connection string uses `mongodb+srv://`

### Collections Empty
- Seed data is auto-created on first successful connection
- Or run seed script manually