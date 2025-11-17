# Egerton AI Study Partner - Architecture Documentation

## 🏗️ System Architecture

### Overview
The student frontend is built as a **Single Page Application (SPA)** using React and Vite, featuring an immersive 3D experience powered by Three.js and React Three Fiber.

## 📦 Core Technologies

### Frontend Framework
- **React 18.2.0**: UI library with hooks and concurrent features
- **Vite 5.0.8**: Ultra-fast build tool and dev server
- **React Router DOM 6.20.0**: Client-side routing

### 3D Graphics
- **Three.js 0.160.0**: WebGL-based 3D library
- **@react-three/fiber 8.15.12**: React renderer for Three.js
- **@react-three/drei 9.92.7**: Useful helpers and abstractions
- **@react-three/postprocessing 2.15.11**: Post-processing effects

### Animation
- **GSAP 3.12.4**: Professional-grade animation library
- **Framer Motion 10.16.16**: React animation library for UI
- **ScrollTrigger**: GSAP plugin for scroll-based animations

### State Management
- **Zustand 4.4.7**: Lightweight state management
- **React Hooks**: Local component state

### Styling
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **PostCSS + Autoprefixer**: CSS processing

### HTTP Client
- **Axios 1.6.2**: Promise-based HTTP client

## 🗂️ Project Structure

```
student-frontend/
├── public/                     # Static assets
│   └── fonts/                 # 3D text fonts (to be added)
├── src/
│   ├── components/            # Reusable components
│   │   ├── 3D/               # Three.js components
│   │   │   ├── CampusScene.jsx
│   │   │   ├── LoginPrism.jsx
│   │   │   ├── FloatingOrb.jsx
│   │   │   └── AIPanels/     # Dashboard 3D panels
│   │   │       ├── ChatPanel.jsx
│   │   │       ├── PlannerPanel.jsx
│   │   │       ├── ResourceHub.jsx
│   │   │       └── ProgressRing.jsx
│   │   └── UI/               # 2D UI components
│   │       ├── Navbar3D.jsx
│   │       └── ModeToggle.jsx
│   ├── pages/                # Route pages
│   │   ├── Landing.jsx       # Home page with 3D scene
│   │   ├── Auth.jsx          # Login/signup with prism
│   │   ├── Dashboard.jsx     # Main app interface
│   │   ├── Features.jsx      # Feature showcase
│   │   └── About.jsx         # About page
│   ├── lib/                  # Utilities and configs
│   │   ├── store.js          # Zustand store
│   │   └── api.js            # Axios instance + endpoints
│   ├── index.css             # Global styles + Tailwind
│   ├── App.jsx               # Root component + routing
│   └── main.jsx              # Entry point
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🎨 Component Architecture

### 3D Scene Hierarchy

```
Canvas (R3F root)
├── PerspectiveCamera
├── Lighting
│   ├── ambientLight
│   ├── directionalLight
│   ├── pointLight
│   └── spotLight
├── Scene Objects
│   ├── CampusScene
│   │   ├── Ground (plane mesh)
│   │   ├── Buildings (5x)
│   │   ├── Trees (30x)
│   │   ├── Clouds (3x)
│   │   └── ParticleField (1000 particles)
│   ├── FloatingOrb (AI assistant)
│   │   ├── Main sphere (distorted mesh)
│   │   ├── Glow layer
│   │   ├── Particles (100x)
│   │   └── Energy rings (3x when active)
│   ├── LoginPrism (auth page)
│   │   ├── 6 cube faces
│   │   ├── Form overlays (HTML)
│   │   └── Explosion particles (on submit)
│   ├── AI Panels (dashboard)
│   │   ├── ChatPanel
│   │   ├── PlannerPanel
│   │   ├── ResourceHub
│   │   └── ProgressRing
│   └── Easter Eggs
│       └── MaizeFarm (9 plants)
├── Environment (preset lighting)
├── OrbitControls (camera control)
└── Effects (post-processing)
```

### State Management Flow

```
Zustand Store (Global)
├── User State
│   ├── user (object)
│   ├── token (string)
│   └── isAuthenticated (boolean)
├── UI State
│   ├── isLoading (boolean)
│   ├── darkMode (boolean)
│   ├── isMobile (boolean)
│   └── showEasterEgg (boolean)
├── 3D State
│   ├── webGLSupported (boolean)
│   ├── use3DFallback (boolean)
│   └── mousePosition (object)
├── Voice State
│   ├── isListening (boolean)
│   └── voiceActive (boolean)
└── Actions
    ├── setUser()
    ├── setToken()
    ├── logout()
    ├── toggleDarkMode()
    ├── incrementLionClick()
    └── setVoiceActive()
```

## 🔄 Data Flow

### Authentication Flow
```
User clicks Login
  → LoginPrism form submit
  → authAPI.login(email, password)
  → Server returns { user, token }
  → store.setUser(user)
  → store.setToken(token) [saves to localStorage]
  → navigate('/dashboard')
```

### Voice Command Flow
```
User clicks mic button
  → toggleVoiceCommand()
  → Request microphone permission
  → Start SpeechRecognition
  → Listen for "Hey Egerton AI"
  → setVoiceActive(true)
  → FloatingOrb isActive prop = true
  → Orb pulses and glows
  → Speak response via SpeechSynthesis
  → setVoiceActive(false) after 3s
```

### Easter Egg Flow
```
User clicks lion logo
  → incrementLionClick()
  → lionClickCount++
  → if (lionClickCount >= 3)
  → showEasterEgg = true
  → MaizeFarm component renders
  → GSAP animation grows farm
  → Notification appears
```

## 🎯 Performance Optimization

### Bundle Splitting
```javascript
// vite.config.js
rollupOptions: {
  output: {
    manualChunks: {
      'three': ['three'],
      'r3f': ['@react-three/fiber', '@react-three/drei']
    }
  }
}
```

### 3D Optimization
- **Geometry instancing**: Reuse geometries for trees/buildings
- **Texture atlasing**: Combined textures where possible
- **LOD (Level of Detail)**: Reduce complexity at distance
- **Frustum culling**: Only render visible objects
- **Lazy loading**: Load 3D models on demand

### Animation Performance
- **GPU acceleration**: Use `transform` and `opacity` for animations
- **RequestAnimationFrame**: GSAP and R3F use RAF for smooth 60fps
- **Debouncing**: Mouse events debounced to 16ms
- **Reduced motion**: Respect `prefers-reduced-motion`

### Code Splitting
```javascript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

## 🔐 Security

### Authentication
- JWT token stored in localStorage
- Token sent in `Authorization: Bearer <token>` header
- Axios interceptor automatically adds token
- 401 responses trigger logout and redirect

### API Protection
- CORS configured on backend
- Rate limiting on API endpoints
- Input validation on forms
- XSS protection via React's JSX escaping

## 📱 Responsive Design

### Breakpoints
```javascript
// Tailwind breakpoints
sm: 640px   // Small devices
md: 768px   // Medium devices
lg: 1024px  // Large devices
xl: 1280px  // Extra large devices
```

### 3D Fallback Strategy
```
1. Check WebGL support on mount
2. If not supported → use3DFallback = true
3. Render simplified 2D UI with CSS 3D transforms
4. Maintain functionality with reduced visuals
```

### Mobile Optimizations
- Reduced particle count (1000 → 200)
- Lower resolution textures
- Simplified geometries
- Touch-optimized controls
- Reduced shadow quality

## 🧪 Testing Strategy

### Unit Tests (Recommended)
- Component rendering
- State management logic
- API client functions
- Utility functions

### Integration Tests (Recommended)
- User flows (login, navigation)
- Form submissions
- Voice command activation
- Easter egg trigger

### Performance Tests
- Lighthouse scores (target >90)
- FPS monitoring (target 60fps)
- Bundle size analysis
- Load time testing

## 🚀 Deployment

### Build Process
```bash
npm run build
# Output: dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-[hash].js
#   │   ├── index-[hash].css
#   │   └── [other chunks]
#   └── [static assets]
```

### Environment Variables
- Development: Uses `.env` file
- Production: Set via hosting platform (Netlify, Vercel, etc.)

### Recommended Hosting
- **Netlify**: Best for SPA, auto-deploy from Git
- **Vercel**: Great DX, edge functions
- **AWS S3 + CloudFront**: Scalable, CDN
- **Render**: Full-stack hosting

## 🔧 Development Workflow

### Local Development
```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Hot Module Replacement (HMR)
Vite provides instant HMR for:
- React components
- CSS/Tailwind
- State updates
- Route changes

### Browser DevTools
- React DevTools: Component inspection
- Three.js Inspector: 3D scene debugging
- Performance tab: FPS monitoring
- Network tab: API call monitoring

## 📚 Learning Resources

### Three.js
- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Journey](https://threejs-journey.com/)

### React Three Fiber
- [R3F Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Docs](https://drei.pmnd.rs/)

### GSAP
- [GSAP Docs](https://greensock.com/docs/)
- [ScrollTrigger](https://greensock.com/scrolltrigger/)

### Framer Motion
- [Framer Motion Docs](https://www.framer.com/motion/)

## 🐛 Common Issues

### Issue: 3D models not loading
**Solution**: Ensure font files in `/public/fonts/` directory

### Issue: Voice commands not working
**Solution**: Requires HTTPS in production (localhost works)

### Issue: Poor mobile performance
**Solution**: Enable 3D fallback or reduce particle count

### Issue: CORS errors
**Solution**: Check backend CORS configuration

## 🎓 Best Practices

1. **Keep 3D scenes simple**: Too many objects = lag
2. **Optimize textures**: Use compressed formats
3. **Monitor bundle size**: Keep chunks small
4. **Profile regularly**: Use React Profiler
5. **Test on devices**: Don't rely on desktop only
6. **Accessibility**: Add keyboard navigation
7. **Progressive enhancement**: Start with 2D, add 3D
8. **Cache assets**: Use service workers

## 🔮 Future Enhancements

- [ ] Add GLB model loading for campus buildings
- [ ] Implement post-processing effects (bloom, DOF)
- [ ] Add VR support with WebXR
- [ ] Create mobile-specific 3D scenes
- [ ] Add loading progress indicators
- [ ] Implement advanced physics
- [ ] Add multiplayer features (lobby system)
- [ ] Create AR study mode
- [ ] Add haptic feedback for mobile
- [ ] Implement PWA features

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: Egerton AI Team
