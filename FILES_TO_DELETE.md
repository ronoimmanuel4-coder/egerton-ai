# 🗑️ Files and Folders to Delete

## Quick Cleanup (Fix Errors Immediately)

Run one of these scripts to automatically clean up:

### Windows:
```cmd
CLEANUP_NOW.bat
```

### Mac/Linux:
```bash
chmod +x cleanup-now.sh
./cleanup-now.sh
```

---

## Manual Cleanup (If Scripts Don't Work)

Delete these folders and files manually:

### ❌ Remove These Folders

```
student-frontend/src/components/Gamification/
student-frontend/src/components/mood-detection/
student-frontend/src/components/Metaverse/
student-frontend/src/test-utils/
```

### ❌ Remove These Files

```
student-frontend/src/contexts/GamificationContext.js
student-frontend/src/contexts/PaymentContext.js
student-frontend/src/pages/HomePage.js
student-frontend/src/pages/Auth/RegisterPage.js
student-frontend/src/pages/MetaversePage.js
student-frontend/src/App.js.backup
student-frontend/src/test-utils/gamification-test-utils.js
```

### ❌ Backend Files (Optional - Not Causing Errors)

```
server/scripts/seedEgertonComplete.js  (you don't need this - data exists)
server/routes/gamification.js  (if exists)
server/routes/payments.js  (if exists)
```

---

## ✅ Keep These Files (NEW Egerton AI)

### **Required New Files:**
```
✅ student-frontend/src/pages/EgertonHomePage.js
✅ student-frontend/src/pages/Auth/EgertonRegisterPage.js
✅ student-frontend/src/components/3D/HolographicAI.js
✅ student-frontend/src/components/Home/EgertonAIHero.js
✅ student-frontend/src/config/egertonBrand.js
✅ student-frontend/src/App.js (modified)
✅ student-frontend/src/theme.js (modified)
✅ student-frontend/src/components/AI/AIChatWidget.js (cleaned)
✅ server/config/egerton.js
✅ server/middleware/egertonOnly.js
✅ server/scripts/getEgertonId.js
```

---

## 🔍 Why Delete These?

### **Gamification** (`components/Gamification/`, `GamificationContext.js`)
- Points, badges, levels system
- Not needed for AI learning platform
- Adds unnecessary complexity
- **Error:** `GamificationProvider` not found

### **Mood Detection** (`components/mood-detection/`)
- Facial recognition via webcam
- Required TensorFlow.js (large bundle)
- Not core to learning platform
- **Error:** `MoodContext` not found in `AIChatWidget`

### **Metaverse** (`components/Metaverse/`, `MetaversePage.js`)
- 3D collaboration space
- Required PeerJS for video calls
- Not needed (we have 3D AI visualization instead)
- **Error:** `PeerProvider` not found

### **Payments** (`PaymentContext.js`)
- Stripe payment integration
- Not needed for educational platform
- **Error:** `PaymentProvider` not found

### **Old Pages** (`HomePage.js`, `RegisterPage.js`)
- Replaced with Egerton-specific versions
- Multi-institution logic removed
- **Replaced by:**
  - `EgertonHomePage.js` (with 3D AI)
  - `EgertonRegisterPage.js` (auto-binds to Egerton)

---

## 🚨 Current Error Fix

The error you're seeing:
```
Cannot destructure property 'mood' of useContext(...) as it is undefined
```

This is because:
1. `AIChatWidget.js` was trying to use `MoodContext`
2. We removed `MoodProvider` from `App.js`
3. The context is now undefined

**Solution:** Already fixed! The cleaned `AIChatWidget.js` no longer uses mood detection.

---

## 📦 After Cleanup

Once you delete these files:

1. **Stop the dev server** (Ctrl+C in terminal)
2. **Clear node_modules cache** (optional):
   ```bash
   cd student-frontend
   rm -rf node_modules/.cache
   ```
3. **Restart dev server**:
   ```bash
   npm start
   ```
4. **Hard refresh browser** (Ctrl+Shift+R or Ctrl+F5)

The errors should be gone! ✅

---

## 🎯 What You'll Have After Cleanup

### ✅ Working Features
- **AI Chat Widget** - Clean, no mood detection
- **3D Holographic AI** - Stunning visualization
- **Egerton Homepage** - AI-first interface
- **Egerton Registration** - Auto-binds to university
- **Course Management**
- **Resource Library**
- **Student Profiles**

### ❌ Removed Features
- Gamification
- Mood Detection
- Metaverse
- Payments
- Multi-institution support

**Result:** Simpler, faster, AI-focused platform! 🚀
