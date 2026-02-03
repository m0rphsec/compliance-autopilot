# Demo GIF Placeholder

**File Required:** `demo.gif`

## Specifications

- **Dimensions:** 1200x675 pixels (16:9 aspect ratio) or 800x600
- **Format:** Animated GIF
- **Duration:** 15-30 seconds
- **Frame rate:** 10-15 fps
- **File size:** < 5MB (GitHub recommendation)

## Demo Flow Sequence

### Scene 1: Pull Request Created (3-4 seconds)
- Show GitHub PR interface
- Highlight code changes in a configuration file
- Example: Modified AWS IAM policy or Kubernetes deployment

### Scene 2: Action Triggers (2-3 seconds)
- Show Actions tab
- "Compliance Autopilot" workflow starts
- Status: Running (yellow dot)

### Scene 3: Checks Running (4-5 seconds)
- Show workflow execution logs
- Display key steps:
  - "🔍 Scanning for compliance violations"
  - "📋 Checking CIS Benchmarks"
  - "✅ Generating compliance report"

### Scene 4: Results Posted (4-5 seconds)
- Return to PR conversation tab
- Bot comment appears with results:
  ```
  🤖 Compliance Autopilot Report

  ✅ PASSED: 12 checks
  ⚠️  WARNINGS: 2 issues
  ❌ FAILED: 0 critical violations

  📊 View detailed report
  ```

### Scene 5: Report Generated (3-4 seconds)
- Click on report link
- Show PDF report preview or summary table
- Highlight key sections (compliance status, recommendations)

## Recording Instructions

### Preparation
1. Set up a demo repository with example violations
2. Create a PR with deliberate compliance issues
3. Configure Compliance Autopilot action
4. Ensure clean GitHub UI (close unnecessary tabs)

### Recording Tools
- **Mac:** Kap (free), ScreenFlow, QuickTime
- **Windows:** ShareX (free), Camtasia, OBS Studio
- **Linux:** Peek (free), SimpleScreenRecorder, Kazam

### Recording Settings
```
Resolution: 1920x1080 or 2400x1350 (will be scaled down)
Quality: High (will be compressed)
Cursor: Show cursor for clicks
Audio: Not needed (silent demo)
```

### Post-Processing
1. **Trim:** Remove dead time, keep only relevant actions
2. **Speed up:** 1.5-2x speed for waiting periods
3. **Add pauses:** 0.5s pause at key moments
4. **Optimize:** Use tools like ezgif.com or gifski
5. **Compress:** Target < 5MB while maintaining readability

### GIF Conversion Tools
- **ffmpeg:** `ffmpeg -i demo.mp4 -vf "fps=15,scale=1200:-1:flags=lanczos" -c:v gif demo.gif`
- **gifski:** `gifski -o demo.gif --fps 15 --width 1200 demo.mp4`
- **Online:** ezgif.com, cloudconvert.com

## Tips for Better Demos
- Use dark mode or light mode consistently
- Hide personal information (profile picture, real repo names)
- Use clear, readable font sizes
- Highlight mouse cursor at important clicks
- Add 1-2 second pause at the end before looping

## TODO
- [ ] Set up demo repository
- [ ] Record screen following the sequence
- [ ] Edit and optimize video
- [ ] Convert to optimized GIF
- [ ] Test GIF in README.md preview
- [ ] Replace this placeholder with actual `demo.gif`
