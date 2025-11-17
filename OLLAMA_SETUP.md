# Ollama Setup for Egerton AI Study Partner

## Your Computer Specs
- **Processor**: Intel Core i3-8130U @ 2.20GHz
- **RAM**: 8GB (7.86GB usable)
- **System**: Windows 64-bit

## Recommended Model for Your Specs
For 8GB RAM, we'll use **Llama 3.2 3B** - perfect balance of intelligence and performance.

## Installation Steps

### 1. Download and Install Ollama (Windows)
```powershell
# Download from: https://ollama.com/download/windows
# Or use this direct link:
# https://ollama.com/download/OllamaSetup.exe
```

**Alternative: Install via PowerShell**
```powershell
# Run PowerShell as Administrator
winget install Ollama.Ollama
```

### 2. Verify Installation
```powershell
# Open new PowerShell/Command Prompt window
ollama --version
```

### 3. Download the AI Model (Llama 3.2 3B - ~2GB download)
```powershell
# This is perfect for your 8GB RAM - fast and intelligent
ollama pull llama3.2:3b

# Alternative: Phi-3 Mini (even smaller, ~2GB, great for constrained systems)
# ollama pull phi3:mini
```

### 4. Test the Model
```powershell
# Start a test chat
ollama run llama3.2:3b

# Try asking: "Explain photosynthesis simply"
# Press Ctrl+D or type /bye to exit
```

### 5. Run Ollama as a Service (Always On)
```powershell
# Ollama automatically runs as a background service on Windows
# Default API: http://localhost:11434

# Test API is running:
curl http://localhost:11434/api/tags
```

## Expected Performance on Your Machine
- **Model Load Time**: 5-10 seconds
- **Response Speed**: 20-40 tokens/second (fast enough for real-time chat)
- **RAM Usage**: ~3-4GB (leaves plenty for Windows + browser)
- **CPU Usage**: 50-80% during generation (normal)

## Troubleshooting

### If Ollama Won't Start
```powershell
# Restart Ollama service
Get-Service Ollama | Restart-Service

# Or manually start:
ollama serve
```

### If Model Download Fails
```powershell
# Check disk space (need ~5GB free)
# Try smaller model:
ollama pull phi3:mini
```

### If Too Slow
```powershell
# Use even smaller model (1.5GB):
ollama pull qwen2:1.5b
```

## Next Steps
Once Ollama is running:
1. Your backend server will connect to `http://localhost:11434`
2. AI will process student questions using exam paper context
3. AI will learn from student interactions and challenge them

## Model Comparison for Your Specs

| Model | Size | RAM Usage | Speed | Intelligence |
|-------|------|-----------|-------|--------------|
| **llama3.2:3b** | 2GB | 3-4GB | Fast ⚡ | Excellent 🧠 |
| phi3:mini | 2GB | 2-3GB | Very Fast ⚡⚡ | Good 🧠 |
| qwen2:1.5b | 1.5GB | 2GB | Ultra Fast ⚡⚡⚡ | Decent 📚 |

**Recommendation**: Start with `llama3.2:3b` - it's the sweet spot for your system.

## Testing Connection from Backend
```bash
# From your project directory
cd server
npm run dev

# Backend will connect to Ollama and show:
# ✅ Ollama connected: llama3.2:3b ready
```
