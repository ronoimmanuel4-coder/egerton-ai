# Egerton AI Study Partner - Student Frontend

A fully interactive, production-ready 3D website for Egerton University's AI Study Partner Platform.

## 🎨 Features

- **Fullscreen 3D Campus Environment**: Low-poly stylized Egerton campus with buildings, trees, and atmospheric effects
- **Floating AI Orb**: Pulsing holographic orb with particle effects
- **3D Login Prism**: Rotating cube with 4 interactive faces (Login, Signup, Guest, Biometric)
- **AI Dashboard**: Floating 3D panels with Chat, Planner, Resource Hub, and Progress Ring
- **Voice Commands**: "Hey Egerton AI" activation with speech recognition
- **3D Text**: Extruded gold letters with animations
- **Easter Egg**: Maize farm that grows when you click the lion logo 3 times
- **Dark/Light Mode**: 3D toggle with sun/moon orbit animation
- **Responsive**: Mobile fallback with simplified 2D + 3D parallax

## 🚀 Tech Stack

- **React 18** + **Vite**
- **Three.js** + **React Three Fiber** (R3F)
- **@react-three/drei** (helpers)
- **GSAP** (scroll animations)
- **Framer Motion** (UI transitions)
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **Axios** (API calls)

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will run on `http://localhost:3000`

### ⚠️ Important: 3D Text Currently Disabled

The landing page 3D text ("AI" and "POWERED LEARNING") is temporarily commented out because it requires font files.

**To enable 3D text:**
1. See `ADDING_3D_TEXT.md` for detailed instructions
2. Download font files from [Three.js repo](https://github.com/mrdoob/three.js/tree/master/examples/fonts)
3. Place in `public/fonts/` directory

**The app works perfectly without 3D text** - all other features are functional!

## 🎮 Usage

### Landing Page
- Scroll to trigger camera fly-through
- Click "Get Started" to go to auth
- Click lion logo 3 times for maize farm easter egg

### Auth Page
- Click and drag to rotate the prism
- Click on a face to access that form
- Forms submit with explosion animation

### Dashboard
- Click and drag to explore 3D panels
- Scroll to zoom
- Click microphone button for voice commands
- Say "Hey Egerton AI" to activate voice assistant

## 📁 File Structure

```
src/
├── components/
│   ├── 3D/
│   │   ├── CampusScene.jsx         # 3D campus with buildings, trees
│   │   ├── LoginPrism.jsx          # Rotating cube with forms
│   │   ├── FloatingOrb.jsx         # AI orb with particles
│   │   └── AIPanels/
│   │       ├── ChatPanel.jsx       # AI chat interface
│   │       ├── PlannerPanel.jsx    # Study planner
│   │       ├── ResourceHub.jsx     # 3D bookshelf
│   │       └── ProgressRing.jsx    # Donut chart
│   └── UI/
│       ├── Navbar3D.jsx            # Navigation
│       └── ModeToggle.jsx          # Dark/light toggle
├── pages/
│   ├── Landing.jsx                 # Hero with 3D scene
│   ├── Auth.jsx                    # Login/signup
│   ├── Dashboard.jsx               # Main app
│   ├── Features.jsx                # Feature showcase
│   └── About.jsx                   # About page
├── lib/
│   ├── store.js                    # Zustand store
│   └── api.js                      # API client
└── App.jsx + main.jsx
```

## 🎨 Brand Colors

```css
Primary Green:    #00a651
Red:              #ed1c24
Gold:             #d2ac67
Dark Green:       #007624
Light Gray:       #bcbec1
Light Green BG:   #e0eee1
```

## 🔧 Configuration

### Environment Variables

- `VITE_API_URL`: Backend API URL (default: `http://localhost:5000/api`)

### Performance

- Target: 60 FPS on mid-range devices
- Load time: <2.5s on 3G
- Lazy-loaded 3D assets
- WebGL fallback for unsupported devices

## 🎯 Key Features

### 3D Components
- Campus with 5 buildings, trees, pathways
- Particle fields (1000+ particles)
- Dynamic lighting (ambient, directional, point, spot)
- Stars background (5000 stars)
- Clouds with opacity

### Animations
- GSAP scroll-triggered camera movement
- Framer Motion UI transitions
- Floating/pulsing effects on all 3D objects
- Explosion animation on login
- Easter egg maize farm growth

### Interactions
- Click and drag to rotate
- Scroll to zoom
- Voice commands with speech recognition
- Hover effects on 3D panels
- Mobile touch support

## 📱 Responsive Design

- Desktop: Full 3D experience
- Tablet: Reduced particle count
- Mobile: Simplified 3D + 2D fallback UI
- WebGL detection with graceful degradation

## 🎤 Voice Commands

Supported commands:
- "Hey Egerton AI" - Activates AI assistant
- More commands can be added in Dashboard.jsx

## 🐛 Known Issues

- Font files for Text3D need to be added to `/public/fonts/`
- Voice recognition requires HTTPS in production
- Mobile performance may vary on older devices

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Built files will be in `dist/` directory.

## 📝 License

Proprietary - Egerton University

## 👥 Credits

Built with ❤️ for Egerton University students
