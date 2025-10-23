# 📸 How to Add Your Photo to the About Page

## Quick Steps

### Option 1: Using the Public Folder (Recommended)

1. **Prepare your photo:**
   - Use a professional photo (headshot or portrait)
   - Recommended size: 500x500 pixels or larger (square format works best)
   - Format: JPG or PNG
   - File size: Keep under 500KB for fast loading

2. **Create the images folder:**
   ```
   student-frontend/
   └── public/
       └── images/          ← Create this folder
           └── founder.jpg  ← Place your photo here
   ```

3. **Add your photo:**
   - Navigate to: `C:\Users\ronoi\OneDrive\Desktop\EduVault\student-frontend\public\`
   - Create a folder named `images` (if it doesn't exist)
   - Copy your photo into this folder
   - Rename it to `founder.jpg` (or `founder.png`)

4. **That's it!** The code is already configured to use `/images/founder.jpg`

---

### Option 2: Using an External URL

If you have your photo hosted online (e.g., LinkedIn, Google Drive, Imgur):

1. **Get the direct image URL**
   - For LinkedIn: Right-click your profile photo → "Copy image address"
   - For Google Drive: Share → Get link → Make sure it's a direct image link
   - For Imgur: Upload → Get direct link

2. **Update the AboutPage:**
   - Open: `student-frontend/src/pages/AboutPage.js`
   - Find line 92: `image: '/images/founder.jpg',`
   - Replace with: `image: 'YOUR_IMAGE_URL_HERE',`

Example:
```javascript
image: 'https://i.imgur.com/yourimage.jpg',
```

---

## Current Configuration

✅ **Name**: Immanuel K. Ronoh  
✅ **Title**: Founder & CEO  
✅ **Email**: eduvault520@gmail.com  
✅ **Phone**: +254 741 218 862  
✅ **Location**: Nakuru, Njoro - Egerton University  

📸 **Photo Path**: `/images/founder.jpg`

---

## Testing Your Photo

1. **Start the development server:**
   ```bash
   cd student-frontend
   npm start
   ```

2. **Navigate to the About page:**
   ```
   http://localhost:3000/about
   ```

3. **Check if your photo appears:**
   - You should see your photo in the "Founder Story" section
   - It will have a hover effect and a rotating heart badge
   - If you see a broken image icon, check the file path

---

## Troubleshooting

### Photo not showing?

**Check 1: File path**
- Make sure the folder is `public/images/` (not `src/images/`)
- File name should be exactly `founder.jpg` or `founder.png`
- Check for typos in the file name

**Check 2: File format**
- Use JPG or PNG format
- Avoid HEIC, WEBP, or other formats (convert them first)

**Check 3: Restart the server**
- Stop the development server (Ctrl+C)
- Start it again: `npm start`
- Refresh your browser

**Check 4: Browser cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open in incognito/private mode

---

## Photo Optimization Tips

### Resize your photo (Optional but recommended):

**Using Windows:**
1. Right-click photo → Edit with Photos
2. Resize to 800x800 pixels
3. Save as JPG

**Using Online Tools:**
- [TinyPNG](https://tinypng.com/) - Compress without losing quality
- [Squoosh](https://squoosh.app/) - Google's image optimizer
- [ResizeImage.net](https://resizeimage.net/) - Quick resize tool

### Recommended Settings:
- **Dimensions**: 800x800px (square)
- **Format**: JPG (smaller file size)
- **Quality**: 80-90% (good balance)
- **File size**: Under 200KB

---

## Alternative: Using a Placeholder

If you don't have a photo ready, you can use a placeholder:

**Option A: Initials Avatar**
```javascript
image: 'https://ui-avatars.com/api/?name=Immanuel+Ronoh&size=500&background=2196f3&color=fff',
```

**Option B: Professional Avatar Generator**
```javascript
image: 'https://avatar.iran.liara.run/public/boy?username=ImmanuelRonoh',
```

---

## File Structure

Your final structure should look like this:

```
EduVault/
└── student-frontend/
    ├── public/
    │   ├── images/
    │   │   └── founder.jpg     ← Your photo here
    │   ├── index.html
    │   └── manifest.json
    ├── src/
    │   └── pages/
    │       └── AboutPage.js    ← Already configured
    └── package.json
```

---

## Need Help?

If you're still having issues:

1. Check the browser console for errors (F12 → Console tab)
2. Verify the file exists: `student-frontend/public/images/founder.jpg`
3. Make sure the file name matches exactly (case-sensitive on some systems)
4. Try using an external URL as a test

---

**That's it!** Once you add your photo, it will appear on the About page with beautiful animations. 🎨✨
