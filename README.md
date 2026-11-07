# SD-Vault • Private Personal Digital Vault

A production-grade, self-hosted, serverless Bring-Your-Own-Storage (BYOS) digital vault application built in **React and JavaScript**. Supabase handles authentication and metadata, while Google Drive provides actual file storage via direct client-side API requests.

The application features an authentic **Fallout-style mechanical blast door** with real-time Web Audio acoustics, Windows Explorer-style image/video previews, recursive nested folder uploads, safe 30-day Google Drive trash lifecycle, and full PWA installation support for desktop and mobile.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│             SD-Vault Client (React 19 + Vite)          │
│                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Fallout Mechanical    │  │ Interactive Vault     │  │
│  │ Blast Door + Acoustics│  │ Explorer & Lightbox   │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  │
│              │                          │              │
│              ▼                          ▼              │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │ Auth & State Machine  │  │ Google Drive Service  │  │
│  │ (useReducer + Session)│  │ (Direct Client-to-API)│  │
│  └───────────┬───────────┘  └───────────┬───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          ▼
   ┌───────────────────────┐  ┌───────────────────────┐
   │    Supabase Auth      │  │   Google Drive API    │
   │  (OAuth & Row Level   │  │ (Direct Browser Fetch │
   │   Security Metadata)  │  │  Storage & Streaming) │
   └───────────────────────┘  └───────────────────────┘
```

* **Zero Backend Servers**: All uploads, downloads, streaming, directory traversals, and deletions are executed directly from the user's browser to Google Drive's API.
* **Zero Secrets in Frontend**: Only public client IDs and Supabase anon keys are bundled in client assets; no client secrets or refresh tokens are stored in `localStorage`.
* **State Machine Coordination**: React `useReducer` state machines govern both authentication lifecycle and vault drive operations.

---

## Key Features

1. **Fallout Vault-Tec Mechanical Blast Door**:
   * Circular industrial blast door matching the official SD-Vault vector logo (12 perimeter cogs, dual armor rings, hex rivets, embossed gold SD-VAULT hub).
   * Web Audio API sound synthesizer with sub-bass impacts, motorized servo whine, pneumatic air hiss releases, and heavy iron blast slams.
   * Tap-to-authenticate door interaction with a 10-second auto-hiding terminal.
   * Smooth reverse closing animation on sign out with zero dashboard flashing.

2. **Windows Explorer-Style Drive Navigation**:
   * Small thumbnail previews for images and videos with responsive grid and list layouts.
   * Full in-app MediaViewer lightbox with zoom, rotate, pan, and HTML5 video/audio playback.
   * Deeply nested folder uploads preserving multi-tier folder hierarchies (`webkitRelativePath`).

3. **Safe Deletion & Trash Lifecycle**:
   * Moving items to trash applies Google's 30-day automatic purge policy.
   * Dedicated Trash tab with one-click **Restore** and **Permanent Delete**.
   * Recursive directory cleanup ensures nested folders never leave orphaned files behind in Trash.

4. **Accurate Storage Metrics**:
   * Dedicated tracking of actual Google Drive files and Drive Trash usage, separate from Gmail/Photos.

5. **PWA Mobile & Desktop Installation**:
   * Transparent 32-bit ARGB icons (`192x192`, `512x512`, `apple-touch-icon`) with zero square background box.
   * Mobile bottom navigation bar for one-tap switching on smartphones.

---

## Step-by-Step Vercel Deployment Guide

Deploying SD-Vault to Vercel requires configuring three services: Vercel, Supabase, and Google Cloud Console.

### Step 1: Push Project to GitHub & Import into Vercel
1. Push your repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of SD-Vault"
   git branch -M main
   git remote add origin https://github.com/your-username/sd-vault.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com) and click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import your `sd-vault` repository.

### Step 2: Configure Environment Variables in Vercel
In the Vercel project deployment screen (or under **Project Settings** $\rightarrow$ **Environment Variables**), add:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://pcymltrqubrchyjkcqpl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Public Anon Key | `eyJhbGciOi...` |
| `VITE_APP_URL` | Your live production Vercel URL | `https://your-sd-vault.vercel.app` |

Click **Deploy**. Vercel will build and assign you a live production URL (e.g., `https://your-sd-vault.vercel.app`).

### Step 3: Update Supabase Authentication URL Settings
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** $\rightarrow$ **URL Configuration**.
3. Under **Site URL**, change `http://localhost:5173` to your production URL:
   ```
   https://your-sd-vault.vercel.app
   ```
4. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://your-sd-vault.vercel.app/**
   https://your-sd-vault.vercel.app/
   ```
5. Click **Save**.

### Step 4: Update Google Cloud Console OAuth Credentials
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Click on your **OAuth 2.0 Client ID** (under *Web application*).
3. Under **Authorized JavaScript origins**, click **+ ADD URI** and enter:
   ```
   https://your-sd-vault.vercel.app
   ```
4. Under **Authorized redirect URIs**, ensure your Supabase callback URL is present:
   ```
   https://pcymltrqubrchyjkcqpl.supabase.co/auth/v1/callback
   ```
   *(Note: Because Supabase coordinates the OAuth flow, Google always redirects through Supabase's callback handler before redirecting back to your Vercel URL).*
5. Click **Save**.

---

## Future Architecture Roadmap: Cloudflare R2 & Backblaze B2

While Google Drive Bring-Your-Own-Storage works well for Google users, Google's 7-day token expiration policy in unverified testing mode requires periodic re-authentication.

For a completely unrestricted digital vault that supports **standard email/password sign-in**, social logins, and infinite token longevity from any device, SD-Vault can expand to S3-compatible cloud storage:

### 1. Cloudflare R2 (Recommended S3 BYOS)
* **Zero Egress Fees**: Downloading, previewing, and streaming large video or audio files incurs \$0 in bandwidth fees forever.
* **10 GB Free Storage**: Free tier includes 10 GB storage and 1,000,000 Class A write operations per month.
* **Presigned URLs**: The browser requests a short-lived presigned upload/download URL via a Supabase Edge Function and uploads directly to R2 without intermediate servers.

### 2. Backblaze B2
* **10 GB Free Tier**: Highly durable S3-compatible object storage.
* **Predictable Pricing**: Simple \$0.006/GB/month pricing beyond the free tier.

### Target Multi-Storage Architecture Plan:

```
┌────────────────────────────────────────────────────────┐
│               SD-Vault Storage Engine                  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │             Unified Vault Storage Adapter         │  │
│  │ (uploadFile, listDir, deleteItem, getStreamUrl)  │  │
│  └────────┬─────────────────┬───────────────────┬───┘  │
└───────────┼─────────────────┼───────────────────┼──────┘
            │                 │                   │
            ▼                 ▼                   ▼
    ┌───────────────┐ ┌───────────────┐   ┌───────────────┐
    │ Google Drive  │ │ Cloudflare R2 │   │ Backblaze B2  │
    │ (OAuth Token) │ │(S3 Presigned) │   │ (S3 REST API) │
    └───────────────┘ └───────────────┘   └───────────────┘
```

#### How Authentication Will Work Under S3 BYOS:
1. User logs in using standard **Email & Password**, Magic Link, or Google OAuth via Supabase Auth.
2. User provides their personal Cloudflare R2 / Backblaze B2 bucket credentials (or uses an integrated Supabase Storage bucket).
3. Supabase Row Level Security (RLS) ensures users can only query their own bucket records.
4. Uploads and streaming work universally across Windows, macOS, Android, and iOS with zero 7-day token expirations!

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/sd-vault.git
cd sd-vault

# Install dependencies
npm install

# Start development server
npm run dev

# Run production build check
npm run build
```

---

## License & Credits

SD-Vault is open-source software built for private digital sovereignty.
* **Framework**: React 19 + Vite
* **Icons**: Lucide Icons
* **Aesthetic**: Fallout-Tec Industrial Vault Theme
