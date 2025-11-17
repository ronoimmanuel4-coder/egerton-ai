# AI Study Partner Setup Checklist

## ✅ Your Computer Specs
- **Processor**: Intel Core i3-8130U @ 2.20GHz ✅
- **RAM**: 8GB ✅ (Perfect for Llama 3.2 3B)
- **System**: Windows 64-bit ✅

## Setup Steps

### 1. Install Ollama ⏱️ 10 minutes
```powershell
# Download and install:
# https://ollama.com/download/windows

# Or use winget:
winget install Ollama.Ollama
```

**Verify installation:**
```powershell
ollama --version
```

### 2. Download AI Model ⏱️ 5 minutes (2GB download)
```powershell
# Recommended for your system:
ollama pull llama3.2:3b

# This will download ~2GB model
# Perfect balance for 8GB RAM
```

**Test the model:**
```powershell
ollama run llama3.2:3b

# Try: "Explain photosynthesis in simple terms"
# Type /bye to exit
```

### 3. Install Backend Dependencies ⏱️ 2 minutes
```powershell
cd c:\Users\ronoi\OneDrive\Desktop\EduVault\server

# If you haven't already:
npm install axios
```

### 4. Update server/app.js ⏱️ 1 minute

Add these routes if not already present:

```javascript
// In server/app.js, add:
const aiRoutes = require('./routes/ai');
const examPaperRoutes = require('./routes/examPapers');

app.use('/api/ai', aiRoutes);
app.use('/api/exam-papers', examPaperRoutes);
```

### 5. Start Everything ⏱️ 2 minutes

**Terminal 1 - Start Backend:**
```powershell
cd c:\Users\ronoi\OneDrive\Desktop\EduVault\server
npm run dev
```

**Terminal 2 - Start Frontend:**
```powershell
cd c:\Users\ronoi\OneDrive\Desktop\EduVault\student-frontend
npm run dev
```

**Ollama** (should already be running as Windows service)
```powershell
# If not running:
ollama serve
```

### 6. Check AI Connection ⏱️ 1 minute

Open browser to your frontend, login, go to dashboard, and check browser console. Or test API directly:

```powershell
# Get your auth token first, then:
curl http://localhost:5000/api/ai/status -H "Authorization: Bearer YOUR_TOKEN"
```

You should see:
```json
{
  "connected": true,
  "model": "llama3.2:3b",
  "modelAvailable": true
}
```

### 7. Add Your 5 Exam Papers ⏱️ 15-20 minutes

Follow the guide in `ADD_EXAM_PAPERS_GUIDE.md`:
1. Get your course and unit IDs
2. Copy-paste text from your 5 exam papers
3. POST each to `/api/exam-papers`
4. Verify they were added

### 8. Test the AI! 🎉

1. Open dashboard
2. Type a message to AI
3. Watch it respond with personalized, challenging questions
4. Try asking about exam topics

## Expected Behavior

### AI Should:
✅ Greet you by name  
✅ Know your course and units  
✅ Reference exam patterns from uploaded papers  
✅ CHALLENGE you with questions (not just answer)  
✅ Ask "What do you already know about...?"  
✅ Guide you to discover answers  
✅ Predict likely exam questions  
✅ Remember your weak/strong points over time  

### AI Should NOT:
❌ Just give you answers directly  
❌ Spoon-feed information  
❌ Respond instantly (will take 2-5 seconds while thinking)  

## Performance Expectations

With your specs:
- **Response time**: 2-5 seconds per message
- **Typing speed**: 20-40 words/second (feels real-time)
- **RAM usage**: 3-4GB (comfortable)
- **CPU usage**: 50-80% during generation (normal)

## Troubleshooting

### "AI temporarily unavailable"
```powershell
# Check if Ollama is running:
ollama list

# Restart if needed:
Get-Service Ollama | Restart-Service
```

### Slow responses (>10 seconds)
```powershell
# Try smaller model:
ollama pull phi3:mini

# Update server/services/aiStudyPartner.js line 12:
# const MODEL_NAME = process.env.OLLAMA_MODEL || 'phi3:mini';
```

### "Model not found"
```powershell
# List available models:
ollama list

# Download the one you want:
ollama pull llama3.2:3b
```

### Out of memory
```powershell
# Use smaller model:
ollama pull qwen2:1.5b

# Only uses 2GB RAM instead of 4GB
```

## What's Next?

Once everything is working:

1. **Add more exam papers** - The more data, the smarter predictions
2. **Train on lecturer patterns** - Add 5-10 past papers per lecturer
3. **Enhance prompts** - Customize AI personality in `aiStudyPartner.js`
4. **Add RAG (Retrieval Augmented Generation)** - Index exam papers for faster search
5. **Track student progress** - AI learns from every conversation
6. **Add lecturer profiles** - Store favorite topics, question styles

## Files Created
- ✅ `server/services/aiStudyPartner.js` - Main AI logic
- ✅ `server/routes/ai.js` - API endpoints
- ✅ `server/routes/examPapers.js` - Exam paper management
- ✅ `server/models/ExamPaper.js` - Database schema
- ✅ `student-frontend/src/pages/Dashboard.jsx` - Connected to AI

## Ready to Go! 🚀

Your setup is complete. The AI is:
- Running locally (private, fast, free)
- Personalized to each student
- Learning from exam patterns
- Challenging students to think deeper
- Predicting what lecturers will ask

Start chatting and watch your AI study partner come to life!
