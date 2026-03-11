<div align="center">

# 🌲 Forest Focus

**A gamified productivity app built with React Native (Expo) for the Seeker Mobile Phone at the Monolith Hackathon.**

*Stay focused. Grow your forest. Get distracted. Watch it die.*

<img src="images/screenshot.png" alt="Forest Focus App Screenshot" width="300" />

## 📹 Demo Video

https://github.com/user-attachments/assets/placeholder

<video src="demo.webm" width="300" controls>
  Your browser does not support the video tag.
</video>

</div>

---

## 🚀 Overview

Forest Focus is a minimal, distraction-aware productivity app where:
- 🌱 A tree grows when you stay focused.
- 🥀 The tree dies if you switch apps or leave the session.
- 🌲 Your focus history builds a visual forest.
- 📊 Your productivity is analyzed with charts and analytics.

Instead of tracking boring streaks, the app visualizes your productivity as a **living forest that evolves over time**.

---

## ✨ Features

### ⏳ Focus Timer
- 15m, 25m, 45m presets and custom duration options.
- Live countdown with Pause and Give Up options.
- Visual tree growth animation during focus sessions.

### 🌲 Gamified Focus System
- Tree grows during an active focus session.
- Tree dies if the user switches apps or gets distracted.
- Real consequence-driven productivity: visual seed → roots → trunk → branches → leaves growth.

### 🌳 3D Forest Visualization
Your completed sessions grow trees inside a **large dynamic forest**.
- Every completed session plants a tree positioned across the forest landscape.
- Depth scaling creates a 3D forest illusion.
- Forest gradually fills as productivity increases, creating a living ecosystem of productivity.

### 📊 My Forest Dashboard & Analytics
The Forest screen contains a full analytics dashboard to help you understand your patterns:
- **Session Statistics:** Trees Grown, Trees Died, Total Focus Time, Average Session Duration.
- **Time Distribution Chart:** See when you are most productive (Morning, Afternoon, Evening, Night).
- **Productivity Analytics:** Switch between Day, Week, Month, and Year views to see how productivity evolves.
- **Focus Calendar:** Highlights days with completed sessions to track streaks and long-term consistency.

### 🌗 Theming
- Light Mode & Dark Mode.
- Clean forest-inspired green aesthetic with a minimal, distraction-free UI.

### 👛 Solana Wallet Integration
- Integrated Solana wallet support built for a Web3-native mobile experience.
- Foundation for on-chain incentives, focus rewards, and future token mechanics.

---

## 🧠 Concept

Most productivity apps track time. **Forest Focus tracks consequences.**

If you stay in the app → your tree grows.  
If you leave → your tree dies.  

Behavioral design meets minimal UX. Over time, your focus sessions create a visual forest representing your productivity journey.

---

## 🛠 Tech Stack

- **Framework:** React Native, Expo
- **Graphics/Animations:** React Native SVG, React Native Reanimated
- **Web3:** Solana Wallet Integration
- **Language:** JavaScript / TypeScript
- **Storage:** Async Storage

---

## 📁 Project Structure

<details>
<summary><b>Click to expand project structure</b></summary>

```text
forest-productivity/
├── app/
│   ├── (drawer)/
│   │   ├── (tabs)/
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   ├── index.tsx
│   └── send.tsx
├── assets/
│   └── images/
├── src/
│   ├── components/
│   │   ├── forest/
│   │   │   ├── AnalyticsTabs.tsx
│   │   │   ├── DailyFocusRing.tsx
│   │   │   ├── ForestCanvas.tsx
│   │   │   ├── ForestStats.tsx
│   │   │   ├── ForestTree.tsx
│   │   │   ├── LevelCard.tsx
│   │   │   ├── SessionCalendar.tsx
│   │   │   └── TimeDistributionChart.tsx
│   │   ├── timer/
│   │   │   └── ProgressRing.tsx
│   │   ├── DurationSelector.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SessionCard.tsx
│   │   ├── TimerControls.tsx
│   │   └── TreeGrowthAnimation.tsx
│   ├── constants/
│   ├── hooks/
│   ├── screens/
│   ├── solana/
│   │   ├── config.ts
│   │   ├── connection.ts
│   │   ├── mobileWallet.ts
│   │   ├── nft.ts
│   │   └── transactions.ts
│   ├── store/
│   └── utils/
├── app.json
├── package.json
└── tsconfig.json

## ⚙️ Installation & Setup

Clone the repo

```bash
git clone https://github.com/your-username/forest-focus.git
cd forest-focus
```

Install dependencies

```bash
npm install
```

Start the Expo server

```bash
npx expo start
```
## 🔮 Future Improvements

- On-chain rewards for completed sessions.
- NFT-based forest trees.
- Streak multipliers.
- Community focus rooms.
- Tokenized accountability system.

📜 License
This project is licensed under the MIT License.

