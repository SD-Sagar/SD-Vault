# SD-Vault Implementation Report

## 1. Project Overview & Architecture
**SD-Vault** is a private, self-hosted, serverless Bring-Your-Own-Storage (BYOS) digital vault application built with React and JavaScript (no TypeScript). Supabase handles authentication and lightweight metadata (favorites, activity logs), while Google Drive serves as the actual file storage provider via direct client-to-Google Drive API calls. There is zero server-side interception of file contents.

The codebase strictly follows a clean, scalable MVC-inspired modular architecture:

```
SD-Vault/
├── .env                       # Local environment variables (URL & Anon key)
├── .env.example               # Template environment configuration
├── supabase/
│   └── schema.sql             # SQL Schema & Row Level Security (RLS) policies
├── src/
│   ├── config/
│   │   └── env.js             # Environment variable validator and reader
│   ├── constants/
│   │   └── index.js           # Scopes, animation states, MIME types, theme tokens
│   ├── models/
│   │   └── VaultItem.js       # Normalized Drive item model (size, mime, dates)
│   ├── services/
│   │   ├── supabaseService.js # Supabase client and auth listeners
│   │   ├── googleAuthService.js # Google OAuth redirect and token extraction
│   │   ├── googleTokenService.js # Token lifecycle, expiration & alive validation
│   │   ├── googleDriveService.js # Drive v3 REST calls, root detection & quotas
│   │   ├── uploadService.js   # Multipart & resumable chunked upload engine
│   │   ├── fileService.js     # Rename, delete, move, copy, download operations
│   │   ├── clipboardService.js# In-app virtual clipboard (persists across folders)
│   │   └── metadataService.js # Supabase favorites and activity logging
│   ├── controllers/
│   │   ├── authController.js  # Auth lifecycle, reconnect & reverse vault sealing
│   │   ├── driveController.js # Drive initialization & quota coordination
│   │   ├── folderController.js# Folder creation & breadcrumbs navigation
│   │   └── fileController.js  # File mutations & batch actions
│   ├── context/
│   │   ├── ThemeContext.jsx   # Light/Dark mode state
│   │   ├── AuthContext.jsx    # Dual-token state machine using useReducer
│   │   └── VaultContext.jsx   # Files, folders, uploads & clipboard useReducer
│   ├── hooks/
│   │   ├── useTheme.js
│   │   ├── useAuth.js
│   │   └── useVault.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── ErrorBoundary.jsx   # Global error boundary
│   │   │   └── ReconnectBanner.jsx # Non-destructive Google reconnect alert
│   │   ├── vault/
│   │   │   ├── MechanicalVaultDoor.jsx # High-detail SVG mechanical door
│   │   │   └── MechanicalVaultDoor.css
│   │   └── drive/
│   │       ├── VaultBreadcrumbs.jsx
│   │       ├── VaultToolbar.jsx
│   │       ├── VaultItemCard.jsx   # Grid view item
│   │       ├── VaultItemRow.jsx    # List view item
│   │       ├── StorageQuotaCard.jsx# Visual storage meter
│   │       ├── FloatingActionButton.jsx # Floating Google Drive '+' button
│   │       ├── SelectionActionBar.jsx  # Multi-select pill action bar
│   │       ├── UploadProgressTray.jsx  # Cancellable upload progress
│   │       ├── NewFolderModal.jsx
│   │       ├── RenameModal.jsx
│   │       ├── DeleteConfirmModal.jsx
│   │       └── VaultEmptyState.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── RecentActivityPage.jsx
│   │   └── VaultExplorerPage.jsx
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   └── AppLayout.css
│   ├── utils/
│   │   └── storage.js         # Safe localStorage utility
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
```

---

## 2. Environment Variables Used

Defined in `.env`:
* `VITE_SUPABASE_URL`: Your Supabase Project URL (e.g., `https://your-project.supabase.co`).
* `VITE_SUPABASE_ANON_KEY`: Supabase Anonymous / Publishable Key.
* `VITE_GOOGLE_CLIENT_ID`: (Optional) Client ID for direct Google OAuth hints.
* `VITE_APP_URL`: Base URL for OAuth redirects (defaults to `window.location.origin`, e.g., `http://localhost:5173`).

---

## 3. Supabase Configuration Requirements

1. **Enable Google Provider in Supabase Dashboard:**
   * Go to **Authentication -> Providers -> Google**.
   * Toggle **Enable Google provider**.
   * Enter your Google OAuth Client ID & Client Secret.
   * Add the required Drive scope under **Scopes**:
     `https://www.googleapis.com/auth/drive.file`
   * Ensure redirect URI (`https://<project-ref>.supabase.co/auth/v1/callback`) is added to authorized redirects in Google Cloud Console.

2. **Execute Database Schema & Row Level Security (RLS):**
   * Open the Supabase SQL Editor and execute the SQL file located at [supabase/schema.sql](file:///c:/Users/RIZA/Desktop/SD-Vault/supabase/schema.sql).
   * This creates the `vault_favorites` and `vault_activity` tables with strict RLS policies allowing users to only access their own records (`auth.uid() = user_id`).
   * No files or binary payloads are stored in Supabase Storage.

---

## 4. Google Cloud Configuration Requirements

* **API Enabled:** Google Drive API must be enabled in your Google Cloud Project.
* **OAuth Consent Screen:**
  * User Type: **External**
  * Publishing Status: **Testing**
  * Test Users: Add your personal Google account email under **Test Users**.
  * Scopes: Add `https://www.googleapis.com/auth/drive.file`.
* **Credentials:**
  * Create an **OAuth 2.0 Client ID** (Web Application).
  * Authorized Redirect URIs: Add your Supabase auth callback URL (`https://<your-project>.supabase.co/auth/v1/callback`).

---

## 5. Google OAuth 7-Day Testing Mode Limitation & In-App Reconnection

### The Limitation
In Google OAuth "External Testing" mode:
1. Google grants refresh tokens that strictly **expire after 7 days**.
2. Normal Google access tokens (`provider_token`) expire after **1 hour** (3600s).
3. Supabase does not automatically refresh Google provider tokens when Supabase's own session JWT refreshes.

### The In-App Solution
SD-Vault handles this limitation gracefully:
1. **Decoupled Session State:** Supabase authentication status is separate from Google Drive provider authorization. When Google authorization expires after 7 days or after a session timeout, **the user remains logged into SD-Vault**.
2. **Proactive Expiration Detection:** `googleTokenService.js` and `googleDriveService.js` detect expiration and status code 401s.
3. **Non-Destructive In-App Reconnect:**
   * A non-intrusive alert banner (`ReconnectBanner.jsx`) surfaces at the top of the vault.
   * Clicking **"Reconnect Google Drive"** invokes `googleAuthService.reconnectGoogleDrive()`, which triggers Google OAuth consent with `access_type=offline` and `prompt=consent`.
   * The new `provider_token` is extracted upon callback and saved to memory/sessionStorage. File explorer operations resume immediately without losing the user's Supabase session.

---

## 6. Features Implemented vs. Pending

| Feature Area | Status | Implementation Details |
| :--- | :---: | :--- |
| **Mechanical Vault Door Animation** | **Completed** | 8 radial bolts retracting/extending, central wheel spinning clockwise/counter-clockwise, 3D swinging blast door, reverse seal on logout, Web Audio mechanical sound synthesis, `prefers-reduced-motion` compliance. |
| **Dark & Light Mode System** | **Completed** | Full design system with CSS tokens, metallic bevels, glowing status indicators, and persistent theme switcher. |
| **Dual-Token Authentication** | **Completed** | Supabase OAuth + Google provider token separation, zero secrets in localStorage, URL hash sanitization. |
| **In-App Reconnect Flow** | **Completed** | Dedicated top banner and Settings panel for refreshing 7-day test credentials without Supabase logout. |
| **Google Drive Root Folder** | **Completed** | Auto-locates or creates `/SD-Vault` in user's root Drive; prevents duplicates and preserves boundaries. |
| **Directory Navigation** | **Completed** | Breadcrumb path with instant ancestor jumping, back navigation, search filtering, and empty states. |
| **Direct File Uploads** | **Completed** | Multipart upload (< 5MB) and Resumable Chunked upload (>= 5MB) direct to Google Drive. |
| **Upload Tray & Drag-and-Drop**| **Completed** | Viewport drag-over dropzone with golden highlight, bottom-right progress tray with percentage bars and cancellation. |
| **File Operations** | **Completed** | Rename, delete, batch delete, move (atomic add/remove parents), copy (`files.copy`), and secure download. |
| **Virtual Clipboard** | **Completed** | Application-managed clipboard supporting Copy, Cut, and Paste across folder navigation. |
| **Live Storage Quota** | **Completed** | Real-time Drive quota display (`drive/v3/about`) with visual progress bar and human-readable units. |
| **Supabase RLS Metadata** | **Completed** | User favorites, audit activity log, and SQL schema with RLS policies (`auth.uid() = user_id`). |
| **Error Handling & Offline** | **Completed** | Global ErrorBoundary, offline connectivity alert banner, and non-blocking retry mechanisms. |
| **Edge Functions** | *Optional / Ready* | Client-side direct reconnect handles 7-day test cycle without requiring paid infrastructure. |

