# 🚀 Egerton AI Study Partner - Quick Start Guide

Get the 3D student frontend up and running in 5 minutes!

## ⚡ Fast Setup

### 1. Prerequisites
- Node.js 20.x or higher
- npm or yarn
- Modern browser (Chrome, Firefox, Edge, Safari)

### 2. Install Dependencies
```bash
cd student-frontend
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work for local development)
# VITE_API_URL=http://localhost:5000/api
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📁 Add Missing Assets

### 3D Text Fonts
Download Three.js fonts and place in `/public/fonts/`:

```bash
# Create fonts directory
mkdir -p public/fonts

# Download fonts (or use your own)
# Required files:
# - helvetiker_bold.typeface.json
# - helvetiker_regular.typeface.json
```

You can get these from:
- [Three.js Examples](https://github.com/mrdoob/three.js/tree/master/examples/fonts)

## 🎮 Quick Feature Tour

### Landing Page (`/`)
1. **Scroll** to see camera fly through campus
2. **Click lion logo** 3 times → Maize farm appears! 🌽
3. **Toggle** dark/light mode with 3D switch
4. Click **"Get Started"** → Go to auth

### Auth Page (`/auth`)
1. **Click and drag** to rotate the cube
2. **Click faces** to access:
   - Front: Login
   - Right: Signup
   - Back: Guest Mode
   - Left: Biometric (demo)
3. Submit form → **Explosion animation** → Dashboard

### Dashboard (`/dashboard`)
1. **Explore 4 3D panels**:
   - Top Left: AI Chat 💬
   - Top Right: Study Planner 📅
   - Bottom Left: Resource Hub 📚
   - Bottom Right: Progress Ring 📊
2. **Click microphone** → Say "Hey Egerton AI"
3. **Click and drag** to rotate view
4. **Scroll** to zoom in/out

## 🎨 Customization Quick Tips

### Change Brand Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  'egerton-green': '#00a651',      // Primary
  'egerton-gold': '#d2ac67',       // Secondary
  'egerton-red': '#ed1c24',        // Accent
  // Add your colors here
}
```

### Adjust 3D Scene
Edit `src/components/3D/CampusScene.jsx`:
```javascript
// Add more buildings
<Building position={[x, 0, z]} height={h} color="#color" />

// Change lighting
<pointLight position={[x, y, z]} intensity={0.5} color="#color" />

// Add more particles
const count = 2000; // Increase particle count
```

### Modify Landing Animation
Edit `src/pages/Landing.jsx`:
```javascript
// Change camera movement
ScrollTrigger.create({
  onUpdate: (self) => {
    cameraRef.current.position.z = 10 - self.progress * 20; // Adjust range
    cameraRef.current.position.y = 5 - self.progress * 5;   // Adjust height
  }
});
```

## 🔧 Common Tasks

### Add New Page
```bash
# 1. Create page component
touch src/pages/NewPage.jsx

# 2. Add route in App.jsx
<Route path="/new" element={<NewPage />} />

# 3. Add navigation link in Navbar3D.jsx
<Link to="/new">New Page</Link>
```

### Add New 3D Component
```bash
# 1. Create component
touch src/components/3D/MyComponent.jsx

# 2. Use in page
import MyComponent from '../components/3D/MyComponent';
<MyComponent position={[0, 0, 0]} />
```

### Connect to Real API
Edit `src/lib/api.js`:
```javascript
// Update endpoints
export const myAPI = {
  getData: () => api.get('/my-endpoint'),
  postData: (data) => api.post('/my-endpoint', data),
};

// Use in component
import { myAPI } from '../lib/api';
const data = await myAPI.getData();
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js
server: {
  port: 3001, // Use different port
}
```

### 3D Scene Not Rendering
1. Check browser console for WebGL errors
2. Update graphics drivers
3. Try different browser
4. Check `webGLSupported` in store

### Voice Commands Not Working
1. Requires HTTPS (works on localhost)
2. Grant microphone permission
3. Check browser compatibility (Chrome/Edge best)

### Slow Performance
1. Reduce particle count in CampusScene
2. Lower camera `maxDistance` in OrbitControls
3. Disable post-processing effects
4. Use production build (`npm run build`)

### npm install Errors
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📱 Mobile Testing

### iOS Simulator
```bash
# If using Xcode
# Set VITE_API_URL to your local IP:
# VITE_API_URL=http://192.168.1.x:5000/api
```

### Android Emulator
```bash
# Access localhost from Android:
# VITE_API_URL=http://10.0.2.2:5000/api
```

### Real Device Testing
```bash
# 1. Get your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Update .env
VITE_API_URL=http://YOUR_IP:5000/api

# 3. Access from device
http://YOUR_IP:3000
```

## 🚀 Production Build

### Build
```bash
npm run build
# Output in dist/
```

### Preview Build
```bash
npm run preview
# Test production build locally
```

### Deploy to Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod
```

### Deploy to Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

## 📊 Performance Monitoring

### Check Bundle Size
```bash
npm run build

# Analyze output
# Look for largest chunks in dist/assets/
```

### Lighthouse Audit
1. Build: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools
4. Run Lighthouse audit
5. Target: >90 on all metrics

### FPS Monitoring
```javascript
// Add to any page
useEffect(() => {
  let lastTime = performance.now();
  let frames = 0;
  
  const measureFPS = () => {
    frames++;
    const now = performance.now();
    if (now >= lastTime + 1000) {
      console.log(`FPS: ${frames}`);
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(measureFPS);
  };
  
  measureFPS();
}, []);
```

## 🎓 Learning Path

### Day 1: Setup & Basics
- ✅ Get project running
- ✅ Explore existing pages
- ✅ Modify colors and text
- ✅ Add simple 3D object

### Day 2: 3D Fundamentals
- ✅ Learn Three.js basics
- ✅ Understand R3F components
- ✅ Create custom 3D object
- ✅ Add animations

### Day 3: Integration
- ✅ Connect to API
- ✅ Add new page/route
- ✅ Implement form
- ✅ Handle state

### Day 4: Advanced Features
- ✅ Custom shaders
- ✅ Post-processing effects
- ✅ Complex animations
- ✅ Performance optimization

### Day 5: Polish & Deploy
- ✅ Test on mobile
- ✅ Fix bugs
- ✅ Optimize bundle
- ✅ Deploy to production

## 🔗 Useful Links

- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://drei.pmnd.rs/)
- [GSAP Docs](https://greensock.com/docs/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Pro Tips

1. **Use React DevTools** to inspect component state
2. **Enable FPS counter** in Three.js scene stats
3. **Test on real devices** early and often
4. **Profile regularly** using Chrome DevTools
5. **Keep scenes simple** - complexity kills performance
6. **Reuse geometries** and materials where possible
7. **Lazy load** heavy components
8. **Cache API responses** to reduce network calls
9. **Use production build** for realistic performance testing
10. **Monitor bundle size** - keep it under 500KB initial load

## 🎉 You're Ready!

Now go build something amazing for Egerton University! 🦁

Need help? Check:
- `README.md` - Full documentation
- `ARCHITECTURE.md` - Technical details
- GitHub Issues - Report bugs

---

**Happy Coding!** 🚀✨
