# FantasticGame - Color Prediction & Arcade Gaming Platform (MERN Stack)

A mobile-friendly, fast, and optimized gaming portal featuring Color Prediction (Win Go), Aviator Crash, Lucky Wheel, and 7 Up 7 Down Dice. Includes integrated Google OAuth 2.0 login, UPI Payment intents (PhonePe, Google Pay, Paytm, BHIM, Navi), manual UTR deposit verification workflow, and an Admin Dashboard.

---

## 🚀 Key Features

1. **Mobile-First & Ultra Fast UI**
   - Built with **React 18**, **Vite**, and **Tailwind CSS**.
   - Custom luxury dark-gold casino theme with bottom navigation bar.
   - Real-time countdown timer & live winning result broadcasts using **Socket.io**.

2. **Games Included**
   - **Win Go (Color Prediction)**:
     - 30s, 1 Min, 3 Min, 5 Min modes.
     - Red (2x), Violet (4.5x), Green (2x).
     - Numbers 0 to 9 (9x payout).
     - Big / Small (2x payout).
     - Multiplier chips (1x, 5x, 10x, 20x, 50x) & quick contract amounts.
     - Live game round records & user bet history with instant win payouts.
   - **Aviator Crash Game**: Rocket climbing multiplier simulation with custom cashout points.
   - **Lucky Wheel**: 10-segment spin wheel with dynamic multipliers up to 10x.
   - **7 Up 7 Down Dice**: 2 rolling dice with predictions on Down (2-6), 7, and Up (8-12).

3. **Google Login & Authentication**
   - Google OAuth 2.0 Client ID: `455420197118-t37dj5otk91n6pvfjtikfknvqvi6o7ta.apps.googleusercontent.com`
   - Google Identity Services (GIS) One-Tap and Sign-in button.
   - Phone / Email registration + Login with JWT tokens.
   - Automatic referral invitation code support (`?invitationCode=47331102020`).

4. **Payments & Wallet System**
   - Deposit amounts (₹100, ₹300, ₹500, ₹1000, ₹2000, ₹5000).
   - Deep link intents for mobile-installed apps:
     - **PhonePe** (`phonepe://pay?pa=...`)
     - **Google Pay** (`tez://upi/pay?pa=...`)
     - **Paytm** (`paytmmp://pay?pa=...`)
     - **BHIM / BharatPe** (`upi://pay?pa=...`)
     - **Navi** (`navi://pay?pa=...`)
   - Dynamic UPI QR Code & One-click Copy UPI ID.
   - 12-Digit UTR submission & tracking.
   - Bank Account / UPI Withdrawal requests.

5. **Admin Dashboard (`/admin`)**
   - **Secret Key Access**: `admin12345` (or admin account credentials).
   - **Verify Deposits**: Inspect submitted 12-digit UTR numbers, player details, and one-click **Approve & Credit Balance** or **Reject**.
   - **Process Withdrawals**: Review requested bank account/UPI ID, mark as paid or reject & refund.
   - **Player Management**: Search players, adjust wallet balances (add/deduct/set), block/unblock accounts.
   - **Platform Configuration**: Update Admin UPI ID, merchant name, QR code, and min/max limits in real time.

---

## 🛠️ Project Structure

```
FantasticGame/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── gameController.js
│   │   └── walletController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Bet.js
│   │   ├── GameRound.js
│   │   ├── Setting.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── gameRoutes.js
│   │   └── walletRoutes.js
│   ├── services/
│   │   └── gameEngine.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BottomNav.jsx
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Deposit.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MiniGames.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── WinGoGame.jsx
│   │   │   └── Withdraw.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── start-all.bat
└── README.md
```

---

## ⚡ How to Run

### 1. Launch with Batch Script
Double click `start-all.bat` in the root folder. It will launch both the backend and frontend in separate command windows.

### 2. Manual Startup
**Backend**:
```bash
cd backend
npm install
node server.js
```
Runs at: `http://localhost:5000`

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173` (and accessible from your phone via the Network IP shown in terminal).

---

## 🔐 Credentials & Secrets
- **MongoDB Atlas**: Connected to `cluster0.u56vcyx.mongodb.net` with user `dskv658_db_user`.
- **Google OAuth Client ID**: `455420197118-t37dj5otk91n6pvfjtikfknvqvi6o7ta.apps.googleusercontent.com`
- **Admin Secret Key**: `admin12345` (enter this on `/admin` to access the full admin dashboard immediately).
