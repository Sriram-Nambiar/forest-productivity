🌲 Forest Focus Timer

A gamified productivity app built with React Native (Expo) for the
Solana Seeker Mobile Phone at the Monolith Hackathon.

Stay focused. Grow your forest.
Get distracted. Watch it die.

🚀 Overview
<p align="center"> <img src="images/screenshot.png" width="350"/> </p>

Forest Focus Timer is a minimal, distraction-aware productivity app where:

🌱 A tree grows when you stay focused

🥀 The tree dies if you switch apps or leave the session

🌲 Your focus history builds a visual forest

📊 Your productivity is analyzed with charts and analytics

Instead of tracking boring streaks, the app visualizes productivity
as a living forest that evolves over time.

✨ Features
⏳ Focus Timer

15m, 25m, 45m presets

Custom duration option

Live countdown

Pause option

Give Up option

Visual tree growth animation during focus sessions

🌲 Gamified Focus System

Tree grows during active focus session

Tree dies if user switches apps or gets distracted

Real consequence-driven productivity

Visual seed → roots → trunk → branches → leaves growth

🌳 3D Forest Visualization

Your completed sessions grow trees inside a dynamic forest ecosystem.

Every completed session plants a tree

Trees are positioned across the forest landscape

Depth scaling creates a 3D forest illusion

Forest gradually fills as productivity increases

Your focus history becomes a living ecosystem of productivity.

📊 My Forest Dashboard

The Forest screen contains a full analytics dashboard.

🌲 Forest Overview

Visual forest containing all grown trees

Each tree represents a completed session

📈 Session Statistics

🌳 Trees Grown

🥀 Trees Died

⏱ Total Focus Time

📊 Average Session Duration

📊 Focus Analytics

The app provides insights into productivity patterns.

Time Distribution Chart

Focus time is displayed across different periods of the day:

🌅 Morning

☀️ Afternoon

🌆 Evening

🌙 Night

This helps users understand when they are most productive.

📅 Productivity Analytics

Users can analyze productivity across different time ranges.

Switch between:

📅 Day

📆 Week

🗓 Month

📊 Year

Each view updates charts to show how productivity evolves over time.

🗓 Focus Calendar

A calendar view highlights days when focus sessions occurred.

Days with completed sessions are marked

Allows easy tracking of productivity streaks

Helps visualize long-term consistency

🌗 Theming

Light Mode

Dark Mode

Clean forest-inspired green aesthetic

Minimal and distraction-free UI

👛 Solana Wallet Integration

Integrated Solana wallet support

Built for Web3-native mobile experience

Wallet screen included for future reward/token mechanics

Foundation for on-chain incentives & focus rewards

📱 App Preview
<p align="center"> <img src="images/timer.png" width="250"/> <img src="images/forest.png" width="250"/> <img src="images/wallet.png" width="250"/> </p>
🛠 Tech Stack

React Native

Expo

React Native SVG

React Native Reanimated

Solana Mobile Wallet Adapter

TypeScript

Async Storage

Zustand State Management

📂 Project Structure
forest-productivity
│
├── app
│   ├── (drawer)
│   │   ├── (tabs)
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   ├── index.tsx
│   └── send.tsx
│
├── assets
│   └── images
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── icon.png
│       └── splash-icon.png
│
├── src
│   ├── components
│   │   ├── forest
│   │   │   ├── AnalyticsTabs.tsx
│   │   │   ├── DailyFocusRing.tsx
│   │   │   ├── ForestCanvas.tsx
│   │   │   ├── ForestStats.tsx
│   │   │   ├── ForestTree.tsx
│   │   │   ├── LevelCard.tsx
│   │   │   ├── SessionCalendar.tsx
│   │   │   └── TimeDistributionChart.tsx
│   │   │
│   │   ├── timer
│   │   │   └── ProgressRing.tsx
│   │   │
│   │   ├── DurationSelector.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SessionCard.tsx
│   │   ├── TimerControls.tsx
│   │   └── TreeGrowthAnimation.tsx
│
│   ├── hooks
│   │   ├── useFocusTimer.ts
│   │   └── useWallet.ts
│
│   ├── screens
│   │   ├── ForestScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── TimerScreen.tsx
│   │   └── WalletScreen.tsx
│
│   ├── solana
│   │   ├── config.ts
│   │   ├── connection.ts
│   │   ├── mobileWallet.ts
│   │   ├── nft.ts
│   │   └── transactions.ts
│
│   ├── store
│   │   ├── levelStore.ts
│   │   ├── sessionStore.ts
│   │   ├── settingsStore.ts
│   │   ├── timerStore.ts
│   │   └── walletStore.ts
│
│   └── utils
│       ├── analyticsHelpers.ts
│       ├── helpers.ts
│       ├── storage.ts
│       └── types.ts
│
├── app.json
├── metro.config.js
├── package.json
├── tsconfig.json
└── README.md
📱 Built For

Solana Seeker Mobile Phone

Monolith Hackathon

🧠 Concept

Most productivity apps track time.

Forest Focus tracks consequences.

If you stay in the app → your tree grows.
If you leave → your tree dies.

Over time your focus sessions create a visual forest representing your productivity journey.

Behavioral design meets minimal UX.

🔮 Future Improvements

On-chain rewards for completed sessions

NFT-based forest trees

Streak multipliers

Community focus rooms

Advanced productivity analytics

Tokenized accountability system

⚙️ Installation
# Clone the repository
git clone https://github.com/Sriram-Nambiar/forest-productivity.git

# Navigate into the project
cd forest-productivity

# Install dependencies
npm install

# Run the app
npx expo start
📜 License

MIT License



🌲 Animated demo GIF

That version looks much more like a top open-source project and impresses hackathon judges.
