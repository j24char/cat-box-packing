# Cat Box Packing 

<p align="center">
  <img src="assets/icon.png" alt="Cat Box Packing App Icon" width="128" height="128" />
</p>

A cozy puzzle game built with React Native and Expo where players fit various breeds of cats into snug cardboard boxes.

---

## Development Environment

Ensure your local development environment meets the following requirements before building or running the application:

* **Node.js**: `v18.x` or higher
* **Package Manager**: `npm` or `yarn`
* **Framework**: React Native with Expo SDK
* **TypeScript**: Configured with `react-jsx` support
* **iOS Development** (for local iOS builds/simulators):
  * macOS with **Xcode 15+** installed
  * CocoaPods (`sudo gem install cocoapods`)

---

## Tech Stack

- **Frontend:** React Native (Expo)  
- **Backend / Database:** Firebase  
- **Authentication:** Firebase anonymous id 
- **Analytics:** Firebase (anonymous Auth user + Firestore REST push), configured via `GoogleService-Info.plist`
- **Icons & UI:** Ionicons, basic React Native components  

---

## Statistics & Metrics (PRD §7)

The app collects **anonymous** per-installation analytics:
- Gameplay duration (min/max/avg per session)
- Level interactions — drag&drop + rotate (min/max/avg per level)
- Session count
- Retention (D1, D2, D7, D14, D30)
- Level completions

Data is aggregated locally (AsyncStorage) and pushed best-effort to Firestore under
`catBoxAnalytics/installations/{installationId}` using an anonymous Firebase Auth
user created from the project's `GoogleService-Info.plist` configuration. All
network failures are swallowed — analytics never blocks gameplay.

See the in-app **Statistics** screen (Home → Statistics) for the current report. 

## Deployment

1. iOS App Store:

```bash
eas build --platform ios
eas submit -p ios
```

2. Google Play Store: 

```bash
eas build --platform android
eas submit -p android
```
---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/j24char/cat-box-packing.git
cd cat-box-packing
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with your Firebase keys:

```
FIREBASE_URL=your-firebase-url
FIREBASE_KEY=your-firebase-key
```

4. Start the app:

```bash
expo start
```

---