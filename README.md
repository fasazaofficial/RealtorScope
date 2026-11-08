# 🏢 RealtorScope - Live Realtors Research & Prospecting Web UI

A fast, modern, and visual web-based directory built for realtor research data. 

Directly integrated with the live **[Google Spreadsheet](https://docs.google.com/spreadsheets/d/1w7GbikvxTk7eJoNONTOsaHn3M7OzuLrJ/edit?usp=sharing)** to perform real-time searches and updates without manual data entry.

Designed to be hosted **100% free on GitHub Pages** with zero backend infrastructure or external build tools required.

---

## ✨ Key Features

1. **Live Google Sheet Sync (Zero Backend / Free GitHub Pages)**:
   - Uses Google Visualization JSONP to pull fresh sheet data directly in the browser without CORS restrictions or API keys.
   - **Auto-Sync on Reload**: Whenever the webpage is opened or reloaded, it automatically retrieves the newest records from the Google Sheet.
   - **Manual "Sync Now" Button**: One-click manual refresh with an animated status indicator and live timestamp.
   - **Local Cache & Offline Support**: Bundled with a snapshot cache (`data_cache.json` & `localStorage`) for instantaneous (0ms) first-paint loading.

2. **Visual & Intuitive Realtor Cards**:
   - **Header**: Realtor Name, Brokerage, and Status Pills (*Active: Yes/No/Unknown*, *Licensed*, *Confidence: High/Med/Low*).
   - **Primary Contact**:
     - Prominent **Mobile 1** button with verified source tag (e.g. `Confirmed: Cell` or `Probable`), click-to-call (`tel:`), and 1-click clipboard copy.
     - Direct Phone, Clickable Email (`mailto:`), and direct Website / Profile links.
   - **Operating Areas**:
     - Operating City, State/Province, Country.
     - Clickable **Operating Suburbs tags** (clicking any suburb instantly filters for that area).
   - **Last Sold Activity (Visual Highlight Card)**:
     - High-contrast green highlight card displaying the property address, sold city/state, closing date, price, and direct link to the sale record.

3. **Fast Multi-Field Search & Smart Filters**:
   - Universal search across: **Name**, **Mobile 1/2/3**, **Phone**, **Brokerage**, **City**, **Suburbs**, **State**, and **Last Sold Address**.
   - Digit-only phone matching (e.g. searching `4036906060` finds `(403) 690-6060`).
   - Highlighted search match terms (`<mark>`).
   - **Quick Filters**:
     - ⚡ **Active Only** (`Active = Yes`)
     - 🛡️ **Licensed Only** (`Licensed = Yes`)
     - 🏡 **Has Last Sold Record**
     - ⭐ **High Confidence**
     - 🚫 **Hide Test/Junk (On by default)**: Safely filters out placeholder signups and invalid test entries.
   - **State / Province & City Dropdowns**: Dynamically populated with active counts (e.g. `CA (252)`, `FL (204)`, `NC (82)`).
   - **Sorting**: Most Recent Sale Date, Name (A → Z), Highest Confidence.
   - **CSV Export**: Export any filtered view with a single click.

---

## 🚀 How to Host Free on GitHub Pages (Step-by-Step)

Because this app is built purely with vanilla web standards (HTML5, Tailwind CSS, JavaScript), you can host it in under 2 minutes:

### Step 1: Initialize Git and Push to GitHub
In your terminal (inside this folder `/Users/farhan/Documents/Davis Prospects`):

```bash
git init
git add .
git commit -m "Initial commit of RealtorScope"
```

Create a new repository on [GitHub](https://github.com/new) (e.g. named `davis-prospects` or `realtors-directory`), and push:

```bash
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (top navigation tab).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment > Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
6. Within ~60 seconds, GitHub will provide your live URL:
   ```
   https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/
   ```

---

## 💻 How to Run Locally

To preview or run the app on your computer:

```bash
# Option 1: Using Python (Already installed on your Mac)
python3 -m http.server 8080

# Option 2: Using Node.js
npx serve
```

Then open `http://localhost:8080` in your web browser.

---

## 📂 File Structure

```
Davis Prospects/
├── index.html         # Main dashboard UI, header, search bar, filters & modal
├── app.js             # Live Google Sheet sync engine, filtering, search & card rendering
├── styles.css         # Styling, glassmorphic header, animations, last-sold highlight box
├── data_cache.json    # Initial snapshot cache (1,463 records) for zero-latency loading
└── README.md          # Project guide and deployment instructions
```

