# Egerton AI Learning Platform - Transformation Guide

## Overview

EduVault has been transformed into a **single-institution, AI-first learning platform** exclusively for **Egerton University**. The platform now features:

- 🎓 **Egerton University Only** - No multi-institution selection
- 🤖 **Homegrown AI Integration** - Local Llama via Ollama for development
- 🎨 **3D Holographic Interface** - Immersive AI visualization using Three.js/React Three Fiber
- 📊 **Personal Learning Patterns** - AI analyzes each student's learning style
- 📝 **Lecturer Exam Prediction** - AI learns from past papers to predict exam questions
- 🧠 **Custom Mnemonics** - AI-generated memory aids tailored to individual students

---

## 🎨 Brand Identity

### Egerton University Colors

| Color Name    | Hex Code  | RGB             | Usage                                |
|---------------|-----------|-----------------|--------------------------------------|
| Main Green    | `#00a651` | (0, 166, 81)    | Primary UI elements, headers        |
| Dark Green    | `#007624` | (0, 118, 36)    | Formal elements, shadows            |
| Light Green   | `#e0eee1` | (224, 238, 225) | Backgrounds, highlights             |
| Gold/Mustard  | `#d2ac67` | (210, 172, 103) | Accents, prestige elements          |
| Red           | `#ed1c24` | (237, 28, 36)   | Emphasis, alerts                    |
| Gray          | `#bcbec1` | (188, 190, 193) | Neutral elements, text              |

### Logo & Assets

- **Logo**: Heraldic shield featuring Mount Kenya, lion with "Sic Donec" arrow, maize cobs, and open book
- **Favicon**: https://www.egerton.ac.ke/favicon.ico
- **Motto**: "Sic Donec" (Thus it is done / Service through action)

---

## 🗂️ File Structure Changes

### New Files Created

#### **Frontend (student-frontend/src/)**

```
config/
  └── egertonBrand.js              # Egerton brand constants and theme

components/
  └── 3D/
      └── HolographicAI.js          # 3D AI visualization component
  └── Home/
      └── EgertonAIHero.js          # AI-first hero section

pages/
  ├── EgertonHomePage.js            # New Egerton-only homepage
  └── Auth/
      └── EgertonRegisterPage.js    # Egerton-specific registration
```

#### **Backend (server/)**

```
config/
  └── egerton.js                    # Egerton server configuration & AI settings

middleware/
  └── egertonOnly.js                # Single-institution enforcement middleware

scripts/
  └── seedEgertonComplete.js        # Comprehensive Egerton seed script
```

### Modified Files

#### **Backend**

- `server/routes/chatbot.js` - Replaced Grok/OpenAI with local Llama integration
  - Added `callLocalLlama()` function for Ollama API
  - Added `buildEgertonContext()` for enriched prompts
  - Enhanced quiz generation with lecturer context
  - Updated suggestions to be Egerton-specific

#### **Frontend**

- To be updated:
  - `student-frontend/src/App.js` - Route to new Egerton pages
  - `student-frontend/src/pages/HomePage.js` - Replace with EgertonHomePage

---

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Ollama (AI Server)

```bash
# Download from https://ollama.ai

# Start Ollama service
ollama serve

# Pull Llama 2 model (or llama3, mistral, etc.)
ollama pull llama2
```

#### Environment Variables

Add to `server/.env`:

```env
# Egerton Institution ID (will be provided after seeding)
EGERTON_INSTITUTION_ID=<institution_id_from_seed>

# Local AI Configuration
USE_LOCAL_AI=true
LOCAL_LLAMA_URL=http://localhost:11434
LOCAL_LLAMA_MODEL=llama2

# Existing MongoDB and other configs...
MONGODB_URI=mongodb://localhost:27017/eduvault
JWT_SECRET=your_jwt_secret_here
```

#### Seed Egerton Data

```bash
cd server

# Run comprehensive Egerton seed
npm run seed:egerton-complete

# Or manually:
node scripts/seedEgertonComplete.js
```

This will:
- Create/update Egerton University institution
- Seed 20+ courses across all faculties
- Output the `EGERTON_INSTITUTION_ID` to add to `.env`

#### Apply Middleware (Optional)

Update `server/server.js` to enforce Egerton-only:

```javascript
const { injectEgertonContext, filterToEgertonOnly } = require('./middleware/egertonOnly');

// Apply middleware
app.use(injectEgertonContext);
app.use('/api/institutions', filterToEgertonOnly);
```

### 2. Frontend Setup

#### Update App Routes

Edit `student-frontend/src/App.js`:

```javascript
import EgertonHomePage from './pages/EgertonHomePage';
import EgertonRegisterPage from './pages/Auth/EgertonRegisterPage';

// In routes:
<Route path="/" element={<EgertonHomePage />} />
<Route path="/register" element={<EgertonRegisterPage />} />
```

#### Apply Egerton Theme

Update theme provider in `App.js` or `index.js`:

```javascript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { getEgertonTheme } from './config/egertonBrand';

const egertonTheme = createTheme(getEgertonTheme('light'));

<ThemeProvider theme={egertonTheme}>
  {/* App content */}
</ThemeProvider>
```

#### Install Dependencies (if missing)

3D libraries should already be installed. Verify in `package.json`:

```json
{
  "@react-three/fiber": "^8.15.17",
  "@react-three/drei": "^9.90.0",
  "three": "^0.152.2",
  "framer-motion": "^10.16.4"
}
```

### 3. Run the Application

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Backend
cd server
npm run dev

# Terminal 3: Start Frontend
cd student-frontend
npm start
```

---

## 🤖 AI Features Implementation

### 1. Personal Learning Pattern Analysis

**Location**: `server/routes/chatbot.js` - `buildEgertonContext()`

**How it works**:
- AI receives student profile: course, year, learning preferences
- Tracks quiz performance, comprehension speed, common mistakes
- Adapts explanations based on detected learning style

**Data collected**:
- `user.learningPattern` - Visual, Auditory, Kinesthetic, etc.
- `user.strengths` - Topics student excels at
- `user.weaknesses` - Areas needing improvement

### 2. Lecturer Exam Prediction

**Location**: `server/routes/chatbot.js` - quiz generation

**How it works**:
- Lecturers' past exam papers are fed to AI
- AI identifies patterns: question types, topic weights, difficulty
- Predicts likely exam questions based on lecturer's teaching style

**Data needed**:
- Past exam papers (uploaded by students or admin)
- Lecturer teaching patterns
- Topic coverage from syllabus

**Future enhancement**:
```javascript
// Add to student/course schema
lecturer: {
  name: String,
  examPatterns: {
    questionTypes: ['MCQ', 'Essay', 'Problem-solving'],
    topicWeights: { 'Topic A': 30, 'Topic B': 50, ... },
    difficulty: 'medium',
    focusAreas: ['Practical application', 'Theory'],
  }
}
```

### 3. Custom Mnemonics Generation

**Location**: AI prompts in `server/config/egerton.js`

**How it works**:
- Student requests mnemonic for a concept
- AI generates personalized memory aid based on learning style
- Considers student's background, interests, culture

**Example prompt**:
```javascript
`Generate a memorable mnemonic for [concept] tailored to:
- Learning style: ${student.learningPreference}
- Cultural context: Kenyan/Egerton student
- Prior knowledge: ${student.course.name} Year ${student.yearOfStudy}`
```

---

## 🎨 3D Holographic Interface

### Components

1. **HolographicAIScene** - Main 3D scene with rotating AI brain
   - Neural network particle system
   - Orbital rings
   - Animated grid background
   - Auto-rotating camera

2. **EgertonAIHero** - Landing page hero section
   - Full-screen 3D visualization
   - AI query input box
   - Quick prompts
   - Feature showcase

### Customization

Edit `student-frontend/src/components/3D/HolographicAI.js`:

```javascript
// Change AI brain color
<AIBrain color="#00a651" />  // Egerton green

// Adjust particle count (performance)
for (let i = 0; i < 200; i++) {  // Reduce for lower-end devices

// Modify rotation speed
autoRotateSpeed={0.5}  // Slower/faster rotation
```

---

## 📊 Database Schema Updates

### Student Profile Extensions

Add to `server/models/User.js`:

```javascript
// AI Learning Profile
learningPattern: {
  type: String,
  enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
},
studyGoal: String,
strengths: [String],  // Topics student is strong in
weaknesses: [String], // Topics needing improvement
aiInteractions: {
  totalQueries: { type: Number, default: 0 },
  quizzesTaken: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
}
```

### Lecturer Profile (New Model)

Create `server/models/Lecturer.js`:

```javascript
const lecturerSchema = new mongoose.Schema({
  name: String,
  department: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  examPatterns: {
    questionTypes: [String],
    topicWeights: mongoose.Schema.Types.Mixed,
    difficulty: String,
    focusTopics: [String],
  },
  teachingStyle: String,
});
```

---

## 🔒 Security & Privacy

### Data Collection Consent

- Add consent checkbox during registration
- Privacy policy explaining AI data usage
- Option to opt-out of AI features

### Data Storage

- Student learning data stored securely
- Encrypted personal information
- GDPR/FERPA compliance considerations

### Access Control

- Students only see their own AI insights
- Lecturers can view aggregated class patterns (not individual)
- Admin can manage lecturer profiles

---

## 🧪 Testing the AI Integration

### Test Local Llama

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test chat endpoint directly
curl http://localhost:11434/api/chat -d '{
  "model": "llama2",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

### Test via Application

1. Register/login as Egerton student
2. Navigate to AI chat/tutor page
3. Ask a question: "Explain photosynthesis simply"
4. Observe response time and quality

### Monitor AI Performance

Check server logs for:
- AI response time
- Fallback activations
- Error rates

---

## 📈 Next Steps & Roadmap

### Phase 1: Foundation (Current)
- ✅ Single-institution setup (Egerton only)
- ✅ Local Llama integration
- ✅ 3D holographic UI
- ✅ Basic AI prompts

### Phase 2: AI Enhancement
- [ ] Implement student learning pattern tracking
- [ ] Build lecturer exam pattern database
- [ ] Create quiz performance analytics
- [ ] Develop mnemonic generation engine

### Phase 3: Advanced Features
- [ ] Real-time study recommendations
- [ ] Adaptive difficulty quizzes
- [ ] Peer comparison (anonymous)
- [ ] Study group AI matching

### Phase 4: Production
- [ ] Cloud-hosted AI (AWS/Azure)
- [ ] Fine-tuned model on Egerton data
- [ ] Mobile app (React Native)
- [ ] Lecturer dashboard

---

## 🐛 Troubleshooting

### Ollama Connection Issues

**Error**: `ECONNREFUSED localhost:11434`

**Solution**:
```bash
# Ensure Ollama is running
ollama serve

# Check if port is in use
netstat -an | grep 11434
```

### Model Not Found

**Error**: `Model 'llama2' not found`

**Solution**:
```bash
# Pull the model
ollama pull llama2

# List available models
ollama list
```

### 3D Performance Issues

**Issue**: Laggy 3D animations

**Solutions**:
1. Reduce particle count in `HolographicAI.js`
2. Disable auto-rotate: `<OrbitControls autoRotate={false} />`
3. Use `CompactHolographicAI` component for lower-end devices

### Institution ID Not Set

**Error**: `EGERTON_INSTITUTION_ID not set`

**Solution**:
1. Run seed script: `npm run seed:egerton-complete`
2. Copy output ID to `.env`
3. Restart server

---

## 📞 Support

For questions or issues:
- Check server logs: `server/logs/`
- Review AI prompts: `server/config/egerton.js`
- Test endpoints: Use Postman/Thunder Client

---

## 🎓 Credits

**Egerton University**  
Transforming Lives Through Quality Education  
Est. 1939 | Njoro, Nakuru, Kenya  

**AI Model**: Llama 2 (Meta AI) via Ollama  
**3D Graphics**: Three.js, React Three Fiber, Drei  
**UI Framework**: Material-UI, Framer Motion  

---

**Sic Donec** 🦁
