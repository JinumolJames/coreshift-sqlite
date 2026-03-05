# CoreShift: Code Migration Assistant (SQLite Version)

## ✨ **NO PostgreSQL Installation Required!**

This version uses **SQLite** - a lightweight database that requires ZERO installation!

---

## 🚀 Super Quick Setup (5 Minutes!)

### Step 1: Extract Project

1. Extract the zip file to your Desktop
2. You'll see a folder: `coreshift-sqlite`

### Step 2: Install Dependencies

**Open Command Prompt:**
- Press Windows Key + R
- Type: `cmd`
- Press Enter

**Navigate to project:**
```bash
cd Desktop\coreshift-sqlite
```

**Install packages:**
```bash
npm install
```

This takes 2-3 minutes.

### Step 3: Setup Database (Automatic!)

```bash
npm run init-db
```

You should see:
```
✅ Users table created
✅ Projects table created
✅ Code files table created
✅ Migrations table created
✅ Explanations table created
✅ Admins table created
✅ Admin analytics table created
🎉 Database schema created successfully!
```

### Step 4: Get Anthropic API Key

1. Go to: https://console.anthropic.com/
2. Sign up / Login
3. Click "API Keys"
4. Create new key
5. Copy it (starts with `sk-ant-api03-...`)

### Step 5: Configure Environment

```bash
copy .env.example .env
notepad .env
```

Edit these lines:
```env
JWT_SECRET=my_super_secret_key_12345
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
```

Save and close.

### Step 6: Start Server

```bash
npm run dev
```

You should see:
```
🚀 CoreShift server running on port 5000
📊 Health check: http://localhost:5000/api/health
💾 Database: SQLite (No installation required!)
```

### Step 7: Test

Open browser: http://localhost:5000/api/health

You should see:
```json
{
  "status": "ok",
  "message": "CoreShift server is running (SQLite version)",
  "database": "SQLite"
}
```

**✅ DONE! Backend is ready!**

---

## 📂 What's Inside

```
coreshift-sqlite/
├── config/
│   └── database.js          # SQLite configuration
├── database/
│   ├── init-db.js           # Database setup script
│   └── coreshift.db         # SQLite database file (created automatically)
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── auth.js              # Login/Register
│   └── projects.js          # Code migration
├── services/
│   └── codeProcessor.js     # AI code transformation
├── .env.example             # Environment template
├── package.json             # Dependencies
├── server.js                # Main server
└── README.md                # This file
```

---

## 🎯 API Endpoints (Same as PostgreSQL version!)

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get specific project
- `DELETE /api/projects/:id` - Delete project

### Code Migration
- `POST /api/projects/:id/upload` - Upload code
- `POST /api/projects/:id/migrate` - Migrate code
- `GET /api/projects/:id/migrations` - Get migration history

---

## ✅ Advantages of SQLite Version

✅ **No PostgreSQL installation** needed  
✅ **No database configuration** required  
✅ **One command setup**: `npm run init-db`  
✅ **Portable**: Database is just a file  
✅ **Perfect for development** and small projects  
✅ **Same features** as PostgreSQL version  

---

## 🧪 Quick Test with Postman

### 1. Register User
- Method: POST
- URL: `http://localhost:5000/api/auth/register`
- Body (JSON):
```json
{
  "name": "Test User",
  "email": "test@test.com",
  "password": "test123"
}
```

### 2. Login
- Method: POST
- URL: `http://localhost:5000/api/auth/login`
- Body (JSON):
```json
{
  "email": "test@test.com",
  "password": "test123"
}
```

Copy the `token` from response.

### 3. Create Project
- Method: POST
- URL: `http://localhost:5000/api/projects`
- Headers: `Authorization: Bearer YOUR_TOKEN_HERE`
- Body (JSON):
```json
{
  "project_name": "My First Migration"
}
```

---

## 🔄 Reset Database

If you need to start fresh:

```bash
# Delete the database file
del database\coreshift.db

# Recreate it
npm run init-db
```

---

## 📝 Notes

- Database file location: `database/coreshift.db`
- SQLite stores everything in one file
- No server process needed
- Perfect for learning and development
- For production, you can upgrade to PostgreSQL later

---

## 🎓 Project Information

**Student:** Jinumol James  
**Course:** 3rd DC BCA  
**College:** CMS College Kottayam  
**Guide:** Mrs. Delsey MJ  

---

**Built with ❤️ - SQLite Edition**
