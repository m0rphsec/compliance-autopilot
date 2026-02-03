# Prerequisites Checklist - Compliance Autopilot Testing

This document lists everything you need before we can test the action properly.

---

## ✅ Required Tools

### 1. **GitHub CLI (gh)**
- **Status:** Need to verify
- **Purpose:** Create repos, manage releases, test API
- **Install:** `sudo apt install gh` or https://cli.github.com/
- **Verify:** `gh --version`
- **Auth:** `gh auth login`

### 2. **Git**
- **Status:** Need to verify
- **Purpose:** Version control
- **Verify:** `git --version`
- **Config:**
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

### 3. **Node.js & npm**
- **Status:** Need to verify
- **Purpose:** Build and run the action
- **Required:** Node.js 20+
- **Verify:** `node --version && npm --version`

---

## 🔑 Required Credentials

### 1. **Anthropic API Key**
- **Status:** REQUIRED - Need from you
- **Purpose:** Claude Sonnet 4.5 API calls for code analysis
- **Get it:** https://console.anthropic.com/
- **Cost:** ~$0.01-0.10 per analysis (API credits needed)
- **Where to add:** GitHub repository secrets

**Do you have an Anthropic API key?**
- [ ] Yes, I have one
- [ ] No, I need to create one

### 2. **GitHub Personal Access Token**
- **Status:** Probably not needed (gh CLI handles this)
- **Purpose:** GitHub API calls
- **Note:** gh CLI provides token automatically

---

## 📦 Test Repository Setup

### What We'll Create:

1. **Main Repository:** `m0rphsec/compliance-autopilot`
   - The action itself
   - Public repository

2. **Test Repository:** `m0rphsec/compliance-autopilot-test`
   - Where we test the action
   - Can be deleted after testing

---

## 💰 Cost Estimate for Testing

### Anthropic API (Claude Sonnet 4.5):
- **Input:** $3 per million tokens
- **Output:** $15 per million tokens
- **Per test run:** ~$0.01-0.10 (analyzing ~10 files)
- **Full testing:** ~$0.50-2.00 total

**You'll need Anthropic API credits before testing.**

---

## 🔧 What I'll Need From You

### Before We Start:

1. **Confirm Anthropic API Key:**
   - Do you have one?
   - Is it funded with credits?
   - We'll add it to GitHub Secrets

2. **Confirm GitHub Access:**
   - Can create public repositories?
   - No organization restrictions?

3. **Confirm Testing OK:**
   - OK to create 2 test repositories?
   - OK to spend ~$1-2 on API testing?

---

## 📋 Pre-Testing Checklist

Run these commands and tell me if they all work:

```bash
# 1. Check GitHub CLI is authenticated
gh auth status

# 2. Check you can create a repo (dry run)
gh repo list m0rphsec --limit 1

# 3. Check git is configured
git config user.name
git config user.email

# 4. Check Node.js version
node --version  # Should be v20+

# 5. Check project builds
cd /home/chris/projects/compliance-autopilot
npm run build
```

---

## 🚨 Potential Issues

### Issue 1: GitHub CLI Not Authenticated
**Symptom:** `gh auth status` fails
**Fix:**
```bash
gh auth login
# Choose: GitHub.com
# Choose: HTTPS
# Authenticate in browser
```

### Issue 2: Git Not Configured
**Symptom:** No user.name or user.email
**Fix:**
```bash
git config --global user.name "m0rphsec"
git config --global user.email "your-email@example.com"
```

### Issue 3: No Anthropic API Key
**Symptom:** Don't have API key
**Fix:**
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Add $10-20 in credits
6. Copy the key (starts with `sk-ant-...`)

### Issue 4: Insufficient API Credits
**Symptom:** API calls fail with billing error
**Fix:** Add credits at https://console.anthropic.com/settings/billing

---

## ✅ Ready to Test When:

- [ ] GitHub CLI authenticated (`gh auth status` works)
- [ ] Git configured (user.name and user.email set)
- [ ] Node.js 20+ installed
- [ ] Project builds successfully (`npm run build`)
- [ ] Anthropic API key available (funded with credits)
- [ ] OK to create test repositories
- [ ] OK to spend ~$1-2 on testing

---

## 🎯 Next Steps After Prerequisites

Once all prerequisites are met:

1. **Initialize Git Repository**
2. **Deploy Action to GitHub**
3. **Create Test Repository**
4. **Add API Key to Secrets**
5. **Run Test Workflow**
6. **Verify Functionality**
7. **Fix Any Issues**
8. **Validate Success**

---

**Let me know which prerequisites you need help with!**
