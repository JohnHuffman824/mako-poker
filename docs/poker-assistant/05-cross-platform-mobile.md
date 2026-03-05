---
title: "Poker Assistant - Cross-Platform Mobile Strategy"
type: thinking
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, mobile, react-native, expo, ios, android, cross-platform]
related: [00-index, 02-architecture, 06-ux-design]
---

# Cross-Platform Mobile Strategy

Decision: Ship on both iOS and Android from the start using a cross-platform framework.

## Framework Options

### React Native / Expo (Recommended)

**Pros:**
- Existing TypeScript/React skills from Mako Poker transfer directly
- Expo simplifies build, deploy, OTA updates
- Massive ecosystem and community
- Shared types with backend (if using Bun/Elysia)
- Can eject to bare React Native if needed for native modules
- Expo Router for file-based navigation
- EAS Build for cloud builds and app store submission

**Cons:**
- Performance ceiling for complex animations (not a concern for chat-based app)
- Large bundle sizes compared to native
- Some native features require bridging

### Flutter

**Pros:**
- Excellent performance and consistent UI across platforms
- Hot reload is very fast
- Growing ecosystem

**Cons:**
- Dart language — no TypeScript code sharing with backend
- Would lose all Mako Poker code reuse
- Smaller ecosystem than React Native

### Native (SwiftUI + Kotlin)

**Pros:**
- Best performance and platform integration
- No framework abstraction layer
- Latest platform features immediately

**Cons:**
- Two codebases to maintain
- Double the development effort
- No code sharing with backend
- Defeats the purpose of "cross-platform from the start"

### Decision: **React Native with Expo**

The app is primarily a chat interface + data display. Performance requirements are minimal. TypeScript code sharing with the backend is a huge win. Expo simplifies deployment.

## Expo Configuration Notes

### Key Expo Packages
- `expo-router` — file-based navigation
- `expo-secure-store` — JWT token storage
- `expo-haptics` — tactile feedback for actions
- `expo-notifications` — push notifications (study reminders?)
- `expo-splash-screen` — loading experience

### Build & Deploy
- EAS Build for iOS and Android
- EAS Submit for App Store / Play Store submission
- EAS Update for OTA (over-the-air) updates to JS bundle
- TestFlight (iOS) and Internal Testing (Android) for beta

### App Structure (Draft)
```
app/
├── (tabs)/
│   ├── index.tsx          # Quick query (home screen)
│   ├── review.tsx         # Hand review mode
│   ├── study.tsx          # Study/drill mode
│   └── profile.tsx        # Settings, presets, history
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── _layout.tsx            # Root layout with auth guard
└── +not-found.tsx
```

## Shared Code Strategy

### What to Share (Backend <-> Mobile)
- Poker type definitions (Card, Hand, Position, Street, etc.)
- API request/response schemas
- Validation logic
- Constants (hand rankings, position names)

### How to Share
- Monorepo with shared `packages/` (like Mako Poker's `@mako/shared`)
- Or publish as private npm package
- TypeScript ensures type safety across boundaries

## Platform-Specific Considerations

### iOS
- App Store review can take 1-3 days
- Must comply with App Store guidelines (no real-money gambling features)
- In-App Purchase required for subscriptions (Apple takes 30%/15%)
- TestFlight for beta testing

### Android
- Play Store review is faster (~hours)
- Can distribute APK directly for testing
- Google Play Billing for subscriptions (also 30%/15%)
- More permissive about app content

### Compliance Note
This is a **strategy study tool**, NOT a gambling app. It doesn't involve real money, betting, or game play. It should be categorized as Education or Reference, not Games. Important for App Store approval.

## Performance Targets

- App launch: < 2 seconds
- Quick query response: < 5 seconds (includes Claude API call)
- UI interactions: 60fps
- Bundle size: < 50MB
- Memory usage: < 200MB

## MVP Mobile Features

1. Chat interface for natural language queries
2. Session preset configuration
3. Response display with formatted recommendations
4. Basic hand history (past queries)
5. User authentication

## Post-MVP Mobile Features

- Range chart visualization
- EV tree display
- Push notifications for study reminders
- Offline caching of recent queries
- Dark mode
- Widget for quick query from home screen
