# Fix: Ollama Memory Error on 8GB System

## Problem
```
Error: 500 Internal Server Error: model requires more system memory than is currently available
```

## Why This Happens
- Llama 3.2 3B needs ~4-5GB RAM when loaded
- Windows + other apps are using 3-4GB
- Not enough free RAM left

## Solution: Use Smaller Model

### Option 1: Phi-3 Mini (RECOMMENDED for your system)
```powershell
# Download Phi-3 Mini (~2.3GB, uses only 2-3GB RAM)
ollama pull phi3:mini

# Test it
ollama run phi3:mini
```

**Phi-3 Mini Specs:**
- Model size: 2.3GB
- RAM usage: 2-3GB (leaves 5GB for Windows)
- Speed: VERY FAST on your i3
- Intelligence: Excellent for study tasks
- Perfect for 8GB systems

### Option 2: Qwen 2 (Even lighter)
```powershell
# Super small model (~1.5GB, uses only 1.5-2GB RAM)
ollama pull qwen2:1.5b

# Test it
ollama run qwen2:1.5b
```

**Qwen 2 Specs:**
- Model size: 1.5GB
- RAM usage: 1.5-2GB (leaves 6GB for Windows)
- Speed: ULTRA FAST
- Intelligence: Good for basic tasks
- Best for very constrained systems

## Which Should You Choose?

### Choose Phi-3 Mini if:
- ✅ You want best quality AI responses
- ✅ You can close some browser tabs/apps
- ✅ You want university-level understanding
- ✅ **RECOMMENDED for your setup**

### Choose Qwen 2 if:
- ✅ You run many apps simultaneously
- ✅ You want absolute fastest responses
- ✅ You have very limited RAM
- ✅ Basic study help is enough

## Update Your Backend to Use New Model

After choosing a model, update your backend:

```javascript
// Edit: server/services/aiStudyPartner.js
// Line 12, change:
const MODEL_NAME = process.env.OLLAMA_MODEL || 'phi3:mini';
// Or for Qwen:
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2:1.5b';
```

Or use environment variable (better):
```powershell
# Create/edit server/.env file
OLLAMA_MODEL=phi3:mini
# Or
OLLAMA_MODEL=qwen2:1.5b
```

## Test Your New Model

### 1. Run Interactive Chat
```powershell
ollama run phi3:mini
```

Try asking:
```
> Explain photosynthesis in simple terms
> What is the difference between RAM and ROM?
> Help me understand Newton's laws
```

Type `/bye` to exit

### 2. Check Ollama is Running
```powershell
# Test API
curl http://localhost:11434/api/tags
```

You should see your model listed.

### 3. Test from Your Backend

Start your server and check logs for:
```
✅ Ollama connected: phi3:mini ready
```

## Performance Comparison

| Model | Size | RAM | Speed | Quality | Your System |
|-------|------|-----|-------|---------|-------------|
| llama3.2:3b | 2GB | 4-5GB | Fast | Excellent | ❌ Too heavy |
| **phi3:mini** | 2.3GB | 2-3GB | Very Fast | Excellent | ✅ **PERFECT** |
| qwen2:1.5b | 1.5GB | 1.5-2GB | Ultra Fast | Good | ✅ Works great |

## Tips to Free More RAM

If you still have issues:

1. **Close browser tabs** (each tab uses 50-200MB)
2. **Close unnecessary apps** (check Task Manager)
3. **Restart computer** (clears cached RAM)
4. **Disable startup apps** (Task Manager → Startup)

## Expected Performance with Phi-3 Mini

On your i3-8130U with 8GB RAM:
- **Load time**: 3-5 seconds
- **Response speed**: 30-50 tokens/second (very smooth)
- **RAM usage**: 2-3GB (comfortable)
- **CPU usage**: 40-70% (efficient)
- **Perfect for**: Study companion, exam prep, mnemonics

## Next Steps

1. Download phi3:mini
2. Test it with `ollama run phi3:mini`
3. Update backend to use it
4. Restart your server
5. Chat in dashboard - should work perfectly!

The AI will still be:
- ✅ Personal to you
- ✅ Challenging and Socratic
- ✅ Predicting exams
- ✅ Learning your patterns

Just running on a model optimized for your hardware! 🚀
