# URGENT: Fix Ollama RAM Issues

## Your Situation
Even phi3:mini won't load - your system has <2GB free RAM right now.

## Immediate Solutions

### Solution 1: Free Up RAM FIRST (Try This First)

#### Step 1: Check What's Using RAM
```powershell
# Open Task Manager
taskmgr

# Or check in PowerShell:
Get-Process | Sort-Object -Property WS -Descending | Select-Object -First 10 ProcessName, @{Name="Memory(MB)";Expression={[math]::round($_.WS / 1MB, 2)}}
```

#### Step 2: Close Memory Hogs
Close these if you have them open:
- ❌ Chrome/Edge (can use 2-4GB!)
- ❌ Visual Studio Code (if running)
- ❌ Discord/Slack/Teams
- ❌ Any games
- ❌ Multiple File Explorer windows

#### Step 3: Restart Computer
```powershell
# This clears cached RAM
Restart-Computer
```

After restart, **immediately** try:
```powershell
ollama run phi3:mini
```

### Solution 2: Use TINY Model (Guaranteed to Work)

If phi3:mini still fails, use the smallest possible model:

```powershell
# Download tiny model (only 1GB, uses <1GB RAM)
ollama pull tinyllama

# Test it - should work on ANY system
ollama run tinyllama
```

**TinyLlama Specs:**
- Size: 637MB
- RAM: <1GB (works on 4GB systems!)
- Speed: ULTRA FAST
- Quality: Basic but functional
- **WILL WORK on your system**

### Solution 3: Configure Ollama for Low Memory

Create/edit Ollama config to use less RAM:

```powershell
# Set environment variable for Ollama
$env:OLLAMA_NUM_GPU=0  # Force CPU-only mode
$env:OLLAMA_HOST="0.0.0.0:11434"

# Restart Ollama service
Get-Service Ollama | Restart-Service

# Try again
ollama run phi3:mini
```

Or create a config file:
```powershell
# Create Ollama config directory
New-Item -Path "$env:USERPROFILE\.ollama" -ItemType Directory -Force

# Create config file
@"
OLLAMA_NUM_PARALLEL=1
OLLAMA_NUM_GPU=0
OLLAMA_NUM_THREAD=2
"@ | Out-File -FilePath "$env:USERPROFILE\.ollama\config.txt" -Encoding utf8
```

### Solution 4: Use Quantized Model (Most Memory Efficient)

Try Q4 quantized version (uses even less RAM):

```powershell
# Download super compressed version
ollama pull phi3:3.8b-mini-4k-instruct-q4_K_M

# Or try gemma 2b (very efficient)
ollama pull gemma:2b
```

## Recommended Order of Operations

### 1️⃣ First Try: Free RAM + Use Existing Model
```powershell
# Close all apps
# Restart computer
ollama run phi3:mini
```

### 2️⃣ If Still Fails: Use TinyLlama
```powershell
ollama pull tinyllama
ollama run tinyllama
```

### 3️⃣ If TinyLlama Works: Update Backend
```javascript
// server/services/aiStudyPartner.js line 15:
const MODEL_NAME = process.env.OLLAMA_MODEL || 'tinyllama';
```

### 4️⃣ Last Resort: Run Ollama with Force CPU
```powershell
# Stop Ollama
ollama stop

# Set to CPU-only
$env:OLLAMA_NUM_GPU=0

# Start Ollama
ollama serve

# In new terminal, try model
ollama run tinyllama
```

## Check Your Free RAM Right Now

```powershell
# See how much RAM is free
systeminfo | findstr /C:"Available Physical Memory"

# Or use WMI
$os = Get-WmiObject -Class Win32_OperatingSystem
$freeMemory = [math]::round($os.FreePhysicalMemory / 1MB, 2)
Write-Host "Free RAM: $freeMemory GB"
```

**You need at least:**
- 2GB free for phi3:mini
- 1GB free for tinyllama
- 500MB free for gemma:2b (Q4)

## Model Comparison for Low RAM

| Model | Size | Min RAM | Will Work? |
|-------|------|---------|------------|
| llama3.2:3b | 2GB | 4GB | ❌ No |
| phi3:mini | 2.2GB | 2GB | ⚠️ Maybe |
| gemma:2b | 1.4GB | 1.5GB | ⚠️ Likely |
| **tinyllama** | 637MB | **800MB** | ✅ **YES** |

## Quick Decision Tree

```
Do you have 2GB+ free RAM?
├─ YES → Use phi3:mini (best quality)
└─ NO → Do you have 1GB+ free RAM?
    ├─ YES → Use gemma:2b (good quality)
    └─ NO → Use tinyllama (will work but basic)
```

## Update Backend for Your Model

Whatever model works, update this:

```javascript
// server/services/aiStudyPartner.js
const MODEL_NAME = process.env.OLLAMA_MODEL || 'YOUR_WORKING_MODEL';

// Examples:
// 'tinyllama'
// 'gemma:2b'
// 'phi3:mini'
```

Or set in `.env`:
```
OLLAMA_MODEL=tinyllama
```

## Next Steps

1. **Close all apps and restart computer**
2. **Check free RAM**: `systeminfo | findstr /C:"Available Physical Memory"`
3. **If <2GB free**: `ollama pull tinyllama`
4. **If 2GB+ free**: Try `ollama run phi3:mini` again
5. **Test**: Ask AI a question
6. **Update backend** to use the working model
7. **Start your servers** and test dashboard

## Performance Notes

Even tinyllama will:
- ✅ Answer questions
- ✅ Be personalized to student
- ✅ Use exam paper context
- ✅ Challenge students with questions
- ⚠️ Just won't be AS smart as phi3

But it WILL WORK on your system! 🚀

## If Nothing Works

Consider:
1. Upgrade RAM to 16GB (~$40-60) - best long-term solution
2. Use cloud AI (OpenAI/Grok) instead of local - costs money but no RAM needed
3. Run Ollama on another computer and connect via network

But try TinyLlama first - it should work! 💪
