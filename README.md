# Common ¢ents — Private Household Budget App
### For Sumer & Siona

A fully offline-first Progressive Web App (PWA) for household budgeting.  
**All data stays on your device.** Nothing is sent anywhere. No accounts. No subscriptions.

---

## Features

- 🏠 **Dashboard** — spending snapshot, settlement, budget breakdown
- 📊 **Spending** — all transactions with tagging, search, split tracking
- 📈 **Analytics** — bar charts, category trends, savings forecasting
- 📅 **Calendar** — bills, reminders, events on a visual calendar
- 🔔 **Bills & Reminders** — recurring bills with due-date alerts, custom reminders
- 👤 **Profile** — income settings, budget categories, PIN protection, export/import
- 📱 **PWA** — installs on iPhone/Android like a native app
- 🔒 **PIN lock** — 4-digit PIN per user (default: 1234)
- 💾 **Export/Import JSON** — sync between devices manually

---

## Deployment to GitHub Pages (Step-by-Step)

### Step 1 — Create a GitHub account (if you don't have one)
Go to **github.com** and sign up. It's free.

### Step 2 — Create a new repository
1. Click the **+** icon → **New repository**
2. Name it: `common-cents` (or anything you like)
3. Set it to **Private** ← Important for privacy
4. Click **Create repository**

### Step 3 — Upload your files
**Option A — Drag and drop (easiest):**
1. On your new repo page, click **uploading an existing file**
2. Drag the entire `common-cents` folder contents into the browser
3. Click **Commit changes**

**Option B — GitHub Desktop app:**
1. Download GitHub Desktop from desktop.github.com
2. Clone your repo
3. Copy all files into the cloned folder
4. Commit and push

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Choose branch: **main**, folder: **/ (root)**
5. Click **Save**
6. Wait 1-2 minutes, then visit: `https://YOUR-USERNAME.github.io/common-cents/`

### Step 5 — Install on your phones

**iPhone (Sumer & Siona both do this):**
1. Open Safari (must be Safari, not Chrome)
2. Go to your GitHub Pages URL
3. Tap the **Share** button (box with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add** — done!

**Android:**
1. Open Chrome
2. Go to your GitHub Pages URL
3. Tap the menu (⋮) → **Add to Home Screen**
   OR Chrome will show an install banner automatically

---

## Syncing Between Sumer & Siona's Phones

Since data is stored locally on each phone, here's how to sync:

1. On one phone: **Profile → Export Data (JSON)** → saves a file
2. Send that file to the other person (AirDrop, email, iMessage)
3. On the other phone: **Profile → Import / Sync Data** → select the file

Do this whenever you want to sync up. Takes 30 seconds.

---

## Changing Your PIN

Default PIN for both is **1234**.

1. Log in → **Profile** → **Change PIN**
2. Enter your new 4-digit PIN
3. Done — the other person's PIN is unchanged

---

## Privacy Notes

- ✅ All data stored in your phone's browser localStorage
- ✅ Repo is **private** — only you can see it on GitHub
- ✅ GitHub Pages serves the app code (HTML/JS/CSS) but never sees your data
- ✅ No analytics, no tracking, no third-party services
- ✅ Export your data anytime as a JSON file you control

**The only data GitHub sees:** The app code itself (not your transactions, bills, or amounts)

---

## File Structure

```
common-cents/
├── index.html          ← Main app
├── manifest.json       ← PWA config
├── sw.js               ← Service worker (offline support)
├── css/
│   └── app.css         ← All styles
├── js/
│   ├── data.js         ← Data layer (localStorage)
│   ├── charts.js       ← All Chart.js charts + forecasting
│   └── app.js          ← App logic, navigation, forms
└── icons/
    ├── icon-192.svg    ← App icon (small)
    └── icon-512.svg    ← App icon (large)
```

---

## Updating the App

When you want to add features or change anything:
1. Edit the files locally
2. Upload the changed files to GitHub (drag and drop again)
3. GitHub Pages auto-deploys in ~1 minute
4. Refresh the app on your phones

---

Made with care for Sumer & Siona 🏡
