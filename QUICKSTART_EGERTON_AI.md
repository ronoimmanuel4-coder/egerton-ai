# 🚀 Egerton AI Platform - Quick Start Guide

Get your Egerton AI Learning Platform running in **5 minutes**!

---

## ⚡ Prerequisites

- Node.js 16+ installed
- MongoDB running
- Git (optional)

---

## 📦 Step 1: Install Ollama (AI Engine)

### Windows
```powershell
# Download installer from https://ollama.ai
# Run the installer
# Open new terminal and verify:
ollama --version
```

### Mac/Linux
```bash
curl https://ollama.ai/install.sh | sh
```

### Pull Llama Model
```bash
ollama pull llama2
# Or use a different model:
# ollama pull llama3
# ollama pull mistral
```

---

## 🗄️ Step 2: Find Egerton Institution ID

Since you already have Egerton data in your MongoDB, find the institution ID:

```bash
# Connect to MongoDB and find Egerton
mongosh

use eduvault
db.institutions.findOne({ shortName: "EGERTON" })
# Copy the _id value
```

Or query via your backend API once it's running:
```bash
curl http://localhost:5000/api/institutions | grep EGERTON
```

---

## ⚙️ Step 3: Configure Environment

Create/edit `server/.env`:

```env
# MongoDB (your existing cloud connection)
MONGODB_URI=your_mongodb_connection_string_here

# JWT
JWT_SECRET=your_super_secret_key_here_change_this

# Egerton Institution ID (from your database)
EGERTON_INSTITUTION_ID=your_egerton_id_here

# AI Configuration
USE_LOCAL_AI=true
LOCAL_LLAMA_URL=http://localhost:11434
LOCAL_LLAMA_MODEL=llama2

# Port
PORT=5000
```

---

## 🎨 Step 4: Update Frontend Routes

Edit `student-frontend/src/App.js`:

```javascript
// Add imports at the top
import EgertonHomePage from './pages/EgertonHomePage';
import EgertonRegisterPage from './pages/Auth/EgertonRegisterPage';

// Find the Routes section and update:
<Routes>
  <Route path="/" element={<EgertonHomePage />} />
  <Route path="/register" element={<EgertonRegisterPage />} />
  {/* Keep other existing routes */}
</Routes>
```

---

## 🏃 Step 5: Run Everything

Open **3 separate terminals**:

### Terminal 1: Ollama (AI Server)
```bash
ollama serve
```

### Terminal 2: Backend
```bash
cd server
npm run dev
```

### Terminal 3: Frontend
```bash
cd student-frontend
npm start
```

---

## 🎉 You're Done!

Visit: **http://localhost:3000**

You should see:
- ✅ Egerton University branding (green #00a651)
- ✅ 3D holographic AI visualization
- ✅ AI query box on homepage
- ✅ No institution selector (Egerton only!)

---

## 🧪 Test the AI

1. On the homepage, type in the AI query box: **"Explain photosynthesis"**
2. Click Send ➤
3. You should get a response from local Llama!

If it says "Ollama not running":
- Make sure `ollama serve` is running in Terminal 1
- Check `http://localhost:11434/api/tags` in browser

---

## 📝 Register a Test Student

1. Click **"Get Started Free"** or **"Sign Up"**
2. Fill in personal info (no institution selector!)
3. Select a course from Egerton's catalog
4. Set up AI learning preferences
5. Create account ✅

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Start MongoDB
mongod
# Or if using MongoDB service:
sudo systemctl start mongod
```

### "EGERTON_INSTITUTION_ID not set"
```bash
# Find Egerton ID from your database
mongosh
use eduvault
db.institutions.findOne({ shortName: "EGERTON" }, { _id: 1 })
# Add the _id to your .env file
```

### AI responds slowly
- Normal for first request (model loading)
- Subsequent requests should be faster
- Use smaller model: `ollama pull llama2:7b`

### 3D is laggy
- Edit `student-frontend/src/components/3D/HolographicAI.js`
- Reduce particle count: Change `200` to `100` on line ~25

---

## 📚 Next Steps

1. **Customize Branding**: Edit `student-frontend/src/config/egertonBrand.js`
2. **Add More Courses**: Edit `server/scripts/seedEgertonComplete.js`
3. **Enhance AI Prompts**: Edit `server/config/egerton.js`
4. **Fine-tune Models**: Train Llama on Egerton-specific data
5. **Read Full Docs**: See `EGERTON_AI_TRANSFORMATION.md`

---

## 🎓 Features to Try

### AI Chat
- "Create a quiz on organic chemistry"
- "Explain Newton's laws simply"
- "Generate a mnemonic for the periodic table"

### Exam Prediction (Coming Soon)
- Upload lecturer's past papers
- AI learns patterns
- Get predicted exam questions

### Personal Learning
- Take quizzes
- AI adapts to your style
- See strength/weakness analysis

---

## 🆘 Need Help?

Check the logs:
```bash
# Backend logs
cd server
npm run dev
# Watch for errors in terminal

# Frontend logs
# Open browser console (F12)
```

Common issues in `EGERTON_AI_TRANSFORMATION.md` → Troubleshooting section

---

**Sic Donec** 🦁  
*Egerton University - Transforming Lives Through Quality Education*
