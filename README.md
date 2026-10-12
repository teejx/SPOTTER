# SPOTTER

> Precision strength training logbook and progressive overload tracker engineered with React Native and Expo.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61dafb.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-57-000020.svg)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

SPOTTER is an offline-first, performance-oriented mobile workout logbook engineered for lifters and strength athletes. It delivers instant session logging, automated rest intervals, curated character avatars, manual walking metrics, multi-mode theming, and exercise biomechanics without unnecessary friction.

---

## Key Features

- **Native Mobile Experience**: Smooth 60fps React Native mobile interface with tactile haptic feedback (`expo-haptics`), safe area boundary handling (`react-native-safe-area-context`), and screen wake-lock (`expo-keep-awake`) during active workout sessions.
- **Dynamic Multimode Theming Engine**: 6 bespoke visual themes across 3 display modes (`System` automatic OS appearance tracking, `Dark`, and `Light`):
  - **Hyper Crimson**: Obsidian onyx with precision red accents.
  - **Emerald Pro**: Deep slate with vibrant matrix mint accents.
  - **Electric Cobalt**: Midnight abyss with sapphire cyan accents.
  - **Molten Amber**: Espresso onyx with warm molten gold accents.
  - **Swiss Editorial**: Minimalist monochromatic OLED white & carbon black.
  - **Amethyst Void**: Galactic violet with laser lilac accents.
- **Curated Avatar Roster**: 43 distinct game-style avatars rendered via DiceBear 10 across 5 style categories (*Miniavs*, *Dylan*, *Big Smile*, *Big Ears*, and *Line Face*) paired with 8 selectable background color swatches.
- **Profile & Preference Modal**: Dedicated modal dialog for editing athlete credentials, target training focus, body weight, avatar style, and background swatches with real-time UI synchronization.
- **Walking & Steps Tracker**: Dedicated activity logging module capturing step counts, walking distance (km), active duration (minutes), and estimated energy expenditure (kcal).
- **Live Workout Execution**: Fast set logging with classification tagging (`Normal`, `Warmup`, `Drop Set`, `Failure`), automated rest interval countdown timer, and live total volume calculation.
- **Exercise Biomechanics & Library**: 50+ multi-joint and isolation movements categorized across muscle groups with anatomical target mapping, setup cues, execution pointers, common mistakes, and embedded instructional video tutorials (`react-native-youtube-iframe`).
- **Offline-First Persistence**: Zero-latency local persistence powered by `@react-native-async-storage/async-storage` with optional Firebase synchronization.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React Native 0.86, Expo 57 |
| **Language** | TypeScript 6 |
| **Icons & Design** | `@expo/vector-icons` (Ionicons) |
| **Avatars** | DiceBear 10 (`@dicebear/core`, `@dicebear/styles`) |
| **Video & Media** | `react-native-youtube-iframe`, `react-native-webview` |
| **Device Integration** | `expo-haptics`, `expo-keep-awake`, `expo-status-bar` |
| **Data Storage** | `@react-native-async-storage/async-storage` |
| **Optional Cloud Sync** | Firebase Authentication, Cloud Firestore |

---

## Project Structure

```text
src/
├── components/          # Reusable UI components & modals
│   ├── BottomNav.tsx             # Floating responsive application navigation bar
│   ├── EditProfileModal.tsx      # Modal for editing athlete credentials and avatar roster
│   ├── ExerciseGuideModal.tsx    # Biomechanics and embedded video tutorial modal
│   ├── ExercisePickerModal.tsx   # Movement selection dialog with muscle category filtering
│   ├── Header.tsx                # Adaptive header with status badge and profile access
│   ├── LogWalkModal.tsx          # Manual walking activity input dialog
│   ├── RestTimerBanner.tsx       # Floating active rest interval countdown banner
│   └── SignOutConfirmModal.tsx   # Sign-out confirmation dialog
├── context/
│   └── FitnessContext.tsx        # Centralized application state, theme engine, and workout manager
├── lib/
│   ├── dicebear.ts               # DiceBear 10 avatar generation utilities and roster data
│   ├── exercises.ts              # Movement directory with biomechanics and setup cues
│   ├── firebase.ts               # Optional Cloud Firestore and Auth client
│   ├── seedData.ts               # Pre-configured Push/Pull/Legs program split templates
│   └── storage.ts                # AsyncStorage data layer, migrations, and theme persistence
├── screens/             # Primary application tab screens
│   ├── ActiveWorkoutModal.tsx    # Full-screen active workout execution tracker
│   ├── AuthScreen.tsx            # Athlete authentication and guest profile setup
│   ├── CatalogScreen.tsx         # Exercise movement encyclopedia
│   ├── HistoryScreen.tsx         # Historical workout sessions and walking activity log
│   ├── LogScreen.tsx             # Quick session launcher and daily walking summary
│   ├── MetricsScreen.tsx         # Estimated 1RM calculator and volume analytics
│   ├── ProfileScreen.tsx         # Athlete summary, display mode, and theme selector
│   └── RoutinesScreen.tsx        # Workout split manager and routine builder
├── theme/
│   └── colors.ts                 # Dual-palette (Light & Dark) color definitions for all 6 themes
└── types/
    └── index.ts                  # TypeScript domain models and interface definitions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- Android SDK and Java 17 (only required for standalone Android compilation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/teejx/SPOTTER.git
   cd SPOTTER
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Expo development server:

```bash
npm run start
```

Press `a` in the terminal to launch on a connected Android device or emulator, or scan the QR code using the Expo Go application.

### Standalone Build

Compile a standalone, offline-ready Android APK:

```bash
npm run build:apk
```

---

## Configuration

SPOTTER operates fully offline out of the box with zero configuration required. All user profiles, workouts, routines, and walking metrics persist in device-isolated AsyncStorage.

### Optional Cloud Synchronization

To enable multi-device cloud synchronization via Firebase:

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** authentication in Firebase Authentication.
3. Create a **Cloud Firestore** database.
4. Supply your Firebase web credentials in [`src/lib/firebase.ts`](src/lib/firebase.ts) or configure standard environment variables.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
