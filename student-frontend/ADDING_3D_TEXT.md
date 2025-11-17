# Adding 3D Text to Landing Page

The 3D text feature has been temporarily disabled because it requires font files that are not included in the repository.

## Quick Fix to Enable 3D Text

### Step 1: Download Font Files

Download these two JSON font files:
- `helvetiker_bold.typeface.json`
- `helvetiker_regular.typeface.json`

**Option A: From Three.js GitHub**
1. Visit: https://github.com/mrdoob/three.js/tree/master/examples/fonts
2. Download both files (click on file → "Raw" → Save as)

**Option B: Direct Links**
```bash
# Create fonts directory
mkdir public/fonts

# Download fonts (using curl or wget)
curl -o public/fonts/helvetiker_bold.typeface.json https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_bold.typeface.json

curl -o public/fonts/helvetiker_regular.typeface.json https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json
```

**Option C: Manual Download**
1. Create folder: `public/fonts/`
2. Download files from Three.js repo
3. Place both JSON files in `public/fonts/`

### Step 2: Verify File Structure

Your directory should look like:
```
student-frontend/
├── public/
│   └── fonts/
│       ├── helvetiker_bold.typeface.json      ✅
│       └── helvetiker_regular.typeface.json   ✅
├── src/
└── package.json
```

### Step 3: Enable Text3D Components

Edit `src/pages/Landing.jsx`:

**1. Add imports back (line 3):**
```javascript
import { OrbitControls, PerspectiveCamera, Environment, Text3D, Center } from '@react-three/drei';
```

**2. Uncomment Text3D in scene (around line 58-67):**
```javascript
{/* Hero Text 3D */}
<Center position={[0, 6, -2]}>
  <Text3DTitle text="AI" />
</Center>

<Center position={[0, 4.5, -2]}>
  <Text3DSubtitle text="POWERED LEARNING" />
</Center>
```

**3. Uncomment component definitions (around line 183-233):**
```javascript
function Text3DTitle({ text }) {
  // ... component code
}

function Text3DSubtitle({ text }) {
  // ... component code
}
```

### Step 4: Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

## Alternative: Use Different Fonts

You can use any Three.js compatible font:

### Available Fonts
- `helvetiker_regular.typeface.json`
- `helvetiker_bold.typeface.json`
- `optimer_regular.typeface.json`
- `optimer_bold.typeface.json`
- `gentilis_regular.typeface.json`
- `gentilis_bold.typeface.json`
- `droid_sans_regular.typeface.json`
- `droid_sans_bold.typeface.json`

### Change Font in Code

Edit the `font` prop in Text3D components:
```javascript
<Text3D
  font="/fonts/optimer_bold.typeface.json"  // Change here
  // ... other props
>
```

## Alternative: Use HTML Text Instead

If you prefer not to use 3D text, you can use HTML overlays instead:

```javascript
// In Landing.jsx, replace Text3D components with:
<Html
  center
  position={[0, 6, -2]}
  style={{ pointerEvents: 'none' }}
>
  <h1 className="text-9xl font-black text-gradient">AI</h1>
</Html>
```

## Troubleshooting

### Error: "Unexpected token '<'"
**Cause**: Font files not found, server returns 404 HTML page
**Solution**: Verify font files exist in `public/fonts/`

### Text appears but looks wrong
**Cause**: Wrong font file or corrupted JSON
**Solution**: Re-download font files from Three.js repo

### Performance issues with 3D text
**Cause**: Text3D is computationally expensive
**Solution**: 
- Reduce `curveSegments` (try 8 instead of 12)
- Disable beveling (`bevelEnabled={false}`)
- Use fewer text elements

### Text not visible
**Cause**: Camera position or text position issues
**Solution**: Adjust `position` prop or camera position

## Why Font Files Aren't Included

Font files are:
1. Licensed separately from code
2. Large binary JSON files (100-500KB each)
3. Available from Three.js for free
4. User should choose preferred fonts

## Custom Fonts

Want to use your own font?

### Using Facetype.js
1. Visit: https://gero3.github.io/facetype.js/
2. Upload your TTF/OTF font
3. Download generated JSON
4. Place in `public/fonts/`
5. Update font path in code

## Complete Example

Once fonts are added, the Landing page will show:
- Large gold "AI" text (1.5 units tall)
- Green "POWERED LEARNING" text below
- Both with 3D depth and beveling
- Metallic/emissive materials
- Smooth anti-aliasing

The text will be part of the 3D scene and rotate with the camera!

---

**Quick Start**: Just download the two files and put them in `public/fonts/`, then uncomment the code!
