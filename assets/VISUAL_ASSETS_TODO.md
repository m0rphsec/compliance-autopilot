# Visual Assets Creation Checklist

Complete guide for creating all visual assets for Compliance Autopilot.

## 📋 Assets Checklist

### Essential (Must-Have)
- [ ] **Icon** (`icon.png`) - 128x128 PNG
- [ ] **Demo GIF** (`demo.gif`) - Animated workflow demonstration
- [ ] **PR Comment Screenshot** (`screenshots/pr-comment.png`)
- [ ] **PDF Report Screenshot** (`screenshots/pdf-report.png`)
- [ ] **Workflow Run Screenshot** (`screenshots/workflow-run.png`)

### Optional (Nice-to-Have)
- [ ] **Evidence Dashboard** (`screenshots/evidence-dashboard.png`)
- [ ] **Social Media Card** (`social-card.png`) - 1200x630 for sharing
- [ ] **Logo Variants** (SVG, different sizes)
- [ ] **Architecture Diagram** showing how the action works

---

## 🎨 Design Specifications

### Color Palette
```
Primary Blue:    #0066CC  (Trust, Security)
Success Green:   #00CC66  (Approval, Pass)
Warning Yellow:  #FFB800  (Caution, Medium)
Error Red:       #DC143C  (Critical, Fail)
Neutral Gray:    #6B7280  (Text, Borders)
Background:      #FFFFFF  (Light mode)
Background Dark: #1F2937  (Dark mode)
```

### Typography
- **Headings:** Inter, SF Pro Display, or system-ui (600-700 weight)
- **Body Text:** Inter, SF Pro Text, or system-ui (400-500 weight)
- **Code/Mono:** JetBrains Mono, Fira Code, or monospace

### Icon Design Guidelines
- **Style:** Flat design with subtle gradients
- **Elements:** Shield (security) + Checkmark (validation)
- **Sizes needed:** 16x16, 32x32, 64x64, 128x128, 256x256
- **Formats:** PNG (with transparency), SVG (scalable)

---

## 🛠️ Recommended Tools

### Free/Open Source
1. **Vector Graphics**
   - Figma (free tier) - https://figma.com
   - Inkscape (free) - https://inkscape.org
   - Vectr (free) - https://vectr.com

2. **Screenshot Tools**
   - Mac: Built-in (Cmd+Shift+4)
   - Windows: Snipping Tool / ShareX
   - Linux: Flameshot, Spectacle

3. **Screen Recording**
   - Mac: Kap (free) - https://getkap.co
   - Windows: ShareX (free)
   - Linux: Peek (free)
   - Cross-platform: OBS Studio (free)

4. **GIF Optimization**
   - gifski (CLI) - https://gif.ski
   - ezgif.com (online)
   - GIPHY Capture (Mac)

5. **Image Editing**
   - GIMP (free) - https://gimp.org
   - Photopea (online, free) - https://photopea.com

### Paid Options
- Adobe Illustrator (vector graphics)
- Adobe Photoshop (image editing)
- Sketch (Mac, vector design)
- Camtasia (screen recording)

---

## 📐 Step-by-Step Creation Guide

### 1. Create Icon (`icon.png`)

**Steps:**
1. Open Figma or Inkscape
2. Create 256x256 canvas (will scale down)
3. Design shield shape:
   ```
   • Base: Rounded shield outline (stroke: 8px)
   • Gradient: Blue (#0066CC) to Green (#00CC66)
   • Angle: Top-left to bottom-right (135°)
   ```
4. Add checkmark inside:
   ```
   • Shape: Bold checkmark (stroke: 12px)
   • Color: White (#FFFFFF)
   • Position: Centered in shield
   ```
5. Export settings:
   - Format: PNG
   - Resolution: 256x256 (2x)
   - Background: Transparent
   - Then scale to 128x128 for final
6. Save both SVG (source) and PNG (final)

**Quick Alternative:**
Use a free icon from Heroicons or Material Icons:
```bash
# Download shield-check icon
curl -O https://heroicons.com/outline/shield-check.svg
# Edit colors in SVG editor
# Export to PNG
```

---

### 2. Create Demo GIF (`demo.gif`)

**Preparation:**
1. Set up demo repository:
   ```bash
   git clone https://github.com/m0rphsec/demo-compliance-app
   # Add deliberate compliance violations
   # Configure Compliance Autopilot action
   ```

2. Create Pull Request with violations:
   - Modified AWS CloudTrail config
   - Kubernetes deployment without security context
   - Title: "Add infrastructure configuration"

**Recording:**
1. Open PR in browser (clean UI, close extra tabs)
2. Start screen recording (1920x1080)
3. Record sequence:
   - Show PR diff (2-3 sec)
   - Navigate to Actions tab (2 sec)
   - Show workflow running (3-4 sec pause)
   - Show workflow completion (2 sec)
   - Return to PR, show bot comment (4-5 sec)
   - Click report link, show PDF preview (3 sec)
4. Stop recording

**Post-Processing:**
```bash
# Convert to GIF with gifski (best quality)
gifski -o demo.gif --fps 15 --width 1200 recording.mp4

# Or use ffmpeg
ffmpeg -i recording.mp4 -vf "fps=15,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" demo.gif

# Optimize file size (target < 5MB)
gifsicle -O3 --lossy=80 -o demo-optimized.gif demo.gif
```

**Online Alternative:**
1. Upload MP4 to ezgif.com
2. Click "Video to GIF"
3. Set: Width=1200, FPS=15
4. Click "Convert"
5. Click "Optimize" > Choose "Lossy GIF" level 80
6. Download optimized GIF

---

### 3. Create Screenshots

#### A. PR Comment Screenshot

**Steps:**
1. Trigger Compliance Autopilot on demo PR
2. Wait for bot comment to appear
3. Open browser DevTools (F12)
4. Set viewport: 1200x800
5. Scroll to bot comment
6. Use browser screenshot tool or:
   ```bash
   # Mac
   Cmd + Shift + 4, then drag to select comment area

   # Windows
   Win + Shift + S, select area

   # Linux (Flameshot)
   flameshot gui
   ```
7. Crop to show only relevant portion
8. Save as PNG

**Editing Tips:**
- Ensure text is crisp and readable
- Include GitHub's comment UI elements
- Show clear pass/warning/fail indicators
- Highlight key information

#### B. PDF Report Screenshot

**Steps:**
1. Download generated compliance report PDF
2. Open in PDF viewer at 100% zoom
3. Capture first page showing:
   - Report header with repo/PR info
   - Executive summary with metrics
   - First 1-2 detailed findings
4. Export/screenshot as PNG
5. Crop if needed

#### C. Workflow Run Screenshot

**Steps:**
1. Open Actions tab for completed workflow
2. Click on workflow run
3. Expand all job steps
4. Set browser zoom to fit all content
5. Capture screenshot showing:
   - Workflow header
   - All job steps
   - Artifacts section
6. Save as PNG

---

### 4. Update README Badges

**Steps:**
1. Open `README.md`
2. Replace placeholder badges with:

```markdown
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Compliance%20Autopilot-blue?logo=github)](https://github.com/marketplace/actions/compliance-autopilot)
[![Build Status](https://github.com/m0rphsec/compliance-autopilot/workflows/CI/badge.svg)](https://github.com/m0rphsec/compliance-autopilot/actions)
[![License](https://img.shields.io/github/license/m0rphsec/compliance-autopilot)](LICENSE)
[![Version](https://img.shields.io/github/v/release/m0rphsec/compliance-autopilot)](https://github.com/m0rphsec/compliance-autopilot/releases)
```

3. Update repository links:
   - Replace all instances of `yourusername` → `m0rphsec`
   - Verify all URLs point to correct repo

---

## 📊 Quality Checklist

Before finalizing each asset:

### Icon
- [ ] Visible and recognizable at 16x16 pixels
- [ ] Works on both light and dark backgrounds
- [ ] File size < 50KB
- [ ] PNG has transparent background
- [ ] Colors match brand palette

### Demo GIF
- [ ] File size < 5MB
- [ ] Smooth animation (10-15 fps)
- [ ] All text readable at actual size
- [ ] Shows complete workflow (PR → Action → Report)
- [ ] Duration 15-30 seconds

### Screenshots
- [ ] High resolution (minimum 1200px width)
- [ ] Text is crisp and readable
- [ ] No personal information visible
- [ ] Consistent UI theme (light/dark)
- [ ] Professional appearance

### README
- [ ] All badges working and pointing to correct URLs
- [ ] All links verified
- [ ] Images load correctly in GitHub preview
- [ ] Consistent formatting

---

## 🚀 Quick Start Template

If you need to create assets quickly, use this priority order:

### Phase 1 (Essential - 2 hours)
1. Icon: Use modified Heroicons shield-check (30 min)
2. PR Comment Screenshot: From real workflow run (20 min)
3. Update README badges (10 min)

### Phase 2 (Important - 3 hours)
4. Workflow Run Screenshot: From Actions tab (20 min)
5. Demo GIF: Record and optimize (2 hours)
6. PDF Report Screenshot: From generated report (20 min)

### Phase 3 (Optional - 1 hour)
7. Evidence Dashboard: Create mockup or skip
8. Social card: Create sharing image
9. Architecture diagram: Visual workflow

---

## 📦 File Organization

Final structure should be:
```
assets/
├── icon.png                    # 128x128 PNG with transparency
├── icon.svg                    # Vector source (optional)
├── demo.gif                    # < 5MB animated demo
├── social-card.png             # 1200x630 (optional)
├── screenshots/
│   ├── pr-comment.png          # PR bot comment
│   ├── pdf-report.png          # Report first page
│   ├── workflow-run.png        # Actions workflow
│   └── evidence-dashboard.png  # Optional
└── VISUAL_ASSETS_TODO.md       # This file
```

---

## 🎯 Success Criteria

Assets are complete when:
- ✅ Icon displays correctly in GitHub Marketplace
- ✅ Demo GIF plays smoothly in README
- ✅ Screenshots clearly demonstrate features
- ✅ All badges in README are functional
- ✅ Visual style is consistent and professional
- ✅ File sizes optimized for web delivery

---

## 📞 Need Help?

**Design Resources:**
- Figma Community: Free templates and icons
- Undraw.co: Free illustrations
- Heroicons: Free icon library
- Coolors.co: Color palette generator

**Questions:**
- Open issue on GitHub: m0rphsec/compliance-autopilot
- Check GitHub Marketplace branding guidelines

**Pro Tip:** Start with the simplest versions and iterate. A clean, simple icon and basic screenshots are better than nothing!
