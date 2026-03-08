# 🌲 Forest Focus

A gamified productivity app built with **React Native (Expo)** for the  
**Seeker Mobile Phone** at the **Monolith Hackathon**.

Stay focused. Grow your forest.  
Get distracted. Watch it die.

---

# 🚀 Overview

Forest Focus is a minimal, distraction-aware productivity app where:

- 🌱 A tree grows when you stay focused
- 🥀 The tree dies if you switch apps or leave the session
- 🌲 Your focus history builds a visual forest
- 📊 Your productivity is analyzed with charts and analytics

Instead of tracking boring streaks, the app visualizes your productivity  
as a **living forest that evolves over time**.

---

Project Structure
forest-productivity/
├── .vscode/
│ ├── extensions.json
│ └── settings.json
├── app/
│ ├── (drawer)/
│ │ ├── (tabs)/
│ │ └── \_layout.tsx
│ ├── \_layout.tsx
│ ├── index.tsx
│ └── send.tsx
├── assets/
│ └── images/
│ ├── android-icon-background.png
│ ├── android-icon-foreground.png
│ ├── android-icon-monochrome.png
│ ├── icon.png
│ └── splash-icon.png
├── scripts/
│ └── reset-project.js
├── src/
│ ├── components/
│ │ ├── forest/
│ │ │ ├── AnalyticsTabs.tsx
│ │ │ ├── DailyFocusRing.tsx
│ │ │ ├── ForestCanvas.tsx
│ │ │ ├── ForestStats.tsx
│ │ │ ├── ForestTree.tsx
│ │ │ ├── LevelCard.tsx
│ │ │ ├── SessionCalendar.tsx
│ │ │ └── TimeDistributionChart.tsx
│ │ ├── timer/
│ │ │ └── ProgressRing.tsx
│ │ ├── DurationSelector.tsx
│ │ ├── ErrorBoundary.tsx
│ │ ├── SessionCard.tsx
│ │ ├── TimerControls.tsx
│ │ ├── TreeGrowthAnimation.tsx
│ │ └── index.ts
│ ├── constants/
│ │ ├── index.ts
│ │ └── timer.ts
│ ├── hooks/
│ │ ├── index.ts
│ │ ├── useFocusTimer.ts
│ │ └── useWallet.ts
│ ├── screens/
│ │ ├── ForestScreen.tsx
│ │ ├── SettingsScreen.tsx
│ │ ├── TimerScreen.tsx
│ │ ├── WalletScreen.tsx
│ │ └── index.ts
│ ├── solana/
│ │ ├── config.ts
│ │ ├── connection.ts
│ │ ├── index.ts
│ │ ├── mobileWallet.ts
│ │ ├── nft.ts
│ │ └── transactions.ts
│ ├── store/
│ │ ├── index.ts
│ │ ├── levelStore.ts
│ │ ├── sessionStore.ts
│ │ ├── settingsStore.ts
│ │ ├── timerStore.ts
│ │ └── walletStore.ts
│ ├── utils/
│ │ ├── analyticsHelpers.ts
│ │ ├── helpers.ts
│ │ ├── index.ts
│ │ ├── storage.ts
│ │ └── types.ts
│ └── polyfills.ts
├── .gitignore
├── README.md
├── app.json
├── eas.json
├── eslint.config.js
├── index.js
├── metro.config.js
├── package-lock.json
├── package.json
└── tsconfig.json
--

# ✨ Features

## ⏳ Focus Timer

- 15m, 25m, 45m presets
- Custom duration option
- Live countdown
- Pause option
- Give Up option
- Visual tree growth animation during focus session

---

## 🌲 Gamified Focus System

- Tree grows during active focus session
- Tree dies if user switches apps or gets distracted
- Real consequence-driven productivity
- Visual seed → roots → trunk → branches → leaves growth

---

## 🌳 3D Forest Visualization

Your completed sessions grow trees inside a **large dynamic forest**.

- Every completed session plants a tree
- Trees are positioned across the forest landscape
- Depth scaling creates a **3D forest illusion**
- Forest gradually fills as productivity increases

Your focus history becomes a **living ecosystem of productivity**.

---

## 📊 My Forest Dashboard

The Forest screen contains a full analytics dashboard.

### 🌲 Forest Overview

- Visual forest containing all grown trees
- Each tree represents a completed session

### 📈 Session Statistics

- 🌳 Trees Grown
- 🥀 Trees Died
- ⏱ Total Focus Time
- 📊 Average Session Duration

---

## 📊 Focus Analytics

The app provides insights into your productivity patterns.

### Time Distribution Chart

Focus time is displayed across different periods of the day:

- 🌅 Morning
- ☀️ Afternoon
- 🌆 Evening
- 🌙 Night

This helps users understand **when they are most productive**.

---

## 📅 Productivity Analytics

Users can analyze productivity across different time ranges.

Switch between:

- 📅 Day
- 📆 Week
- 🗓 Month
- 📊 Year

Each view updates charts to show how productivity evolves over time.

---

## 🗓 Focus Calendar

A calendar view highlights days when focus sessions occurred.

- Days with completed sessions are marked
- Allows easy tracking of productivity streaks
- Helps visualize long-term consistency

---

## 🌗 Theming

- Light Mode
- Dark Mode
- Clean forest-inspired green aesthetic
- Minimal and distraction-free UI

---

## 👛 Solana Wallet Integration

- Integrated Solana wallet support
- Built for Web3-native mobile experience
- Wallet screen included for future reward/token mechanics
- Foundation for on-chain incentives & focus rewards

---

## 🛠 Tech Stack

- React Native
- Expo
- React Native SVG
- React Native Reanimated
- Solana Wallet Integration
- JavaScript / TypeScript
- Async Storage

---

## 📱 Built For

- Seeker Mobile Phone
- Monolith Hackathon

---

## 🧠 Concept

Most productivity apps track time.

Forest Focus tracks consequences.

If you stay in the app → your tree grows.  
If you leave → your tree dies.

Over time your focus sessions create a **visual forest representing your productivity journey**.

Behavioral design meets minimal UX.

---

## 🔮 Future Improvements

- On-chain rewards for completed sessions
- NFT-based forest trees
- Streak multipliers
- Community focus rooms
- Real productivity analytics
- Tokenized accountability system

---

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/your-username/forest-focus.git

# Go into the directory
cd forest-focus

# Install dependencies
npm install

📜 License

MIT License


---

✅ **How to use**

1. Open your repo
2. Open `README.md`
3. Replace contents
4. Paste the code above
5. Commit

---

If you want, I can also give you a **version with screenshot placeholders and demo GIF sections**, which makes the README look **10× more impressive on GitHub.**

# Start Expo
npx expo start
```
