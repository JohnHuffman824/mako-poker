---
title: "Mako Poker Design System"
type: guide
status: active
area: mako-poker
created: 2026-03-05
updated: 2026-03-05
tags:
  - ux
  - mobile
  - react-native
---

# Mako Poker Design System

**Purpose:** Core design system reference for AI agents implementing Mako Poker UI
**Platform:** React Native / Expo (iOS and Android)
**Audience:** AI assistants working on the codebase

---

## 0. Design Philosophy: Refined Minimalism

Mako Poker follows a **Refined Minimalism** aesthetic -- sleek, clean, and engaging. Every element earns its place through
exceptional craft and attention to detail. On mobile, this means generous touch
targets, clear visual hierarchy, and purposeful motion.

### Core Principles

| Principle                      | What It Means                                       | How to Apply                                                    |
|--------------------------------|-----------------------------------------------------|-----------------------------------------------------------------|
| **Precision over decoration**  | Clean lines, intentional spacing, no visual clutter | Use spacing scale strictly, remove unnecessary borders/shadows  |
| **Premium micro-interactions** | Small animations that feel polished and responsive  | Spring physics on presses, subtle transforms on feedback        |
| **Layered depth**              | Visual hierarchy through shadows and elevation      | Elevation tokens for floating elements, inset shadows for wells |
| **Thoughtful timing**          | Animations that feel natural and purposeful         | Staggered entrances, 200ms for taps, 300ms for modals          |
| **Touch-first**                | Everything designed for finger interaction           | 44pt minimum targets, comfortable reach zones, swipe affordance |

### Visual Characteristics

**DO:**
- Clean, uncluttered with generous whitespace
- Responsive with subtle micro-interactions (spring press feedback)
- Layered depth through shadows and elevation
- Motion that communicates state changes
- High contrast text for readability on small screens

**DON'T:**
- Flat and lifeless (missing press/feedback states)
- Cluttered with competing elements
- Over-animated (distracting during gameplay)
- Generic (missing refined polish)
- Tiny touch targets or cramped layouts

---

## 1. Theme Tokens

React Native does not use CSS variables. Instead, define tokens as plain objects
exported from a shared theme module.

### Token Architecture

```typescript
// theme/tokens.ts

export const tokens = {
  colors: { /* Section 2 */ },
  spacing: { /* Section 5 */ },
  radii: { /* Section 6 */ },
  typography: { /* Section 4 */ },
  shadows: { /* Section 7 */ },
} as const
```

### The Cardinal Rule

**No hardcoded colors. Ever.** Use theme tokens exclusively.

```typescript
// WRONG
{ color: '#333', backgroundColor: '#fff' }

// RIGHT
{ color: theme.colors.textPrimary, backgroundColor: theme.colors.surfacePrimary }
```

All components must support dark mode by reading the active theme object.
Never branch on a `colorScheme` string inside component styles -- let the
theme object resolve the correct value.

---

## 2. Color System

### Surface and Text Tokens

| Token                | Light              | Dark               | Use                      |
|----------------------|--------------------|--------------------|-----------------------   |
| `background`         | `#FAFAF9`          | `#121214`          | Screen background        |
| `surfacePrimary`     | `#FFFFFF`          | `#1C1C1E`          | Cards, list rows         |
| `surfaceSecondary`   | `#F2F2F7`          | `#2C2C2E`          | Grouped backgrounds      |
| `surfaceElevated`    | `#FFFFFF`          | `#2C2C2E`          | Modals, action sheets    |
| `textPrimary`        | `#1C1C1E`          | `#F5F5F5`          | Headlines, body text     |
| `textSecondary`      | `#636366`          | `#AEAEB2`          | Captions, timestamps     |
| `textTertiary`       | `#AEAEB2`          | `#636366`          | Placeholders, disabled   |
| `border`             | `#E5E5EA`          | `#38383A`          | Dividers, outlines       |
| `borderSubtle`       | `#F2F2F7`          | `#2C2C2E`          | Faint separators         |

### Accent Colors

| Token                | Value              | Use                           |
|----------------------|--------------------|-------------------------------|
| `accentPrimary`      | `#0A84FF`          | Primary actions, links        |
| `accentSuccess`      | `#30D158`          | Wins, positive indicators     |
| `accentWarning`      | `#FFD60A`          | Caution, marginal spots       |
| `accentDanger`       | `#FF453A`          | Losses, destructive actions   |

### Card Suit Colors

Card suits need high contrast in both themes. Use dedicated tokens so they
remain legible on any surface.

| Token                | Value              | Use                           |
|----------------------|--------------------|-------------------------------|
| `suitSpades`         | `#1C1C1E` / `#F5F5F5` | Spade glyphs and text     |
| `suitClubs`          | `#1C1C1E` / `#F5F5F5` | Club glyphs and text      |
| `suitHearts`         | `#FF3B30`          | Heart glyphs and text (both)  |
| `suitDiamonds`       | `#007AFF`          | Diamond glyphs and text (both)|

Diamonds use blue rather than red to distinguish from hearts at a glance --
a common convention in four-color deck schemes.

### Position Colors

Position indicators appear as small badges or background tints. Keep them
muted -- 15% opacity backgrounds with full-saturation text.

| Token                | Value              | Position                      |
|----------------------|--------------------|-------------------------------|
| `positionEarly`      | `#FF9500`          | UTG, UTG+1, UTG+2            |
| `positionMiddle`     | `#5AC8FA`          | LJ, HJ                       |
| `positionLate`       | `#30D158`          | CO, BTN                       |
| `positionBlinds`     | `#AF52DE`          | SB, BB                        |

### Confidence / GTO Indicators

Solver output displays recommended actions with confidence levels.

| Token                | Value              | Meaning                       |
|----------------------|--------------------|-------------------------------|
| `confidenceHigh`     | `#30D158`          | Strong recommendation (>80%)  |
| `confidenceMedium`   | `#FFD60A`          | Mixed strategy (40-80%)       |
| `confidenceLow`      | `#FF453A`          | Marginal / exploitative (<40%)|

### Action Type Colors

| Token                | Value              | Action                        |
|----------------------|--------------------|-------------------------------|
| `actionFold`         | `#8E8E93`          | Fold                          |
| `actionCheck`        | `#30D158`          | Check / Call                  |
| `actionBet`          | `#FF9500`          | Bet / Raise                   |
| `actionAllIn`        | `#FF453A`          | All-in                        |

---

## 3. Dark Mode

Poker apps are primarily used in dark mode. Design dark-first, then verify light.

### Depth Hierarchy (Dark Mode)

```
7%  - background         Screen background (darkest)
11% - surfaceSecondary   Grouped/recessed areas
14% - surfacePrimary     Cards, list rows
18% - surfaceElevated    Modals, action sheets (lightest)
```

Each layer should be distinguishable without relying on borders. Subtle
1px borders (`borderSubtle`) can reinforce separation where needed.

### Shadow Behavior

In dark mode, shadows are less visible. Compensate with:
- Slightly lighter surface colors for elevated elements
- Subtle top-edge highlight (`rgba(255,255,255,0.05)` border)
- Increased shadow opacity compared to light mode

### Implementation Pattern

```typescript
import { useColorScheme } from 'react-native'

const colorScheme = useColorScheme()
const theme = colorScheme == 'dark' ? darkTheme : lightTheme
```

Provide theme via React context. Components read from context, never from
`useColorScheme` directly.

---

## 4. Typography

### Font Stack

Use system fonts for maximum readability and performance on mobile.

```typescript
// Platform defaults -- no custom font loading needed
const fontFamily = {
  regular: undefined,   // System default (SF Pro on iOS, Roboto on Android)
  medium: undefined,
  semibold: undefined,
  bold: undefined,
  mono: 'monospace',    // For card notation, hand ranges
}
```

If a custom font is added later, update this single location.

### Type Scale

Optimized for mobile screens. All sizes in logical pixels.

| Name       | Size | Line Height | Weight   | Use                              |
|------------|------|-------------|----------|----------------------------------|
| `heroXl`   | 34   | 41          | Bold     | Pot size, big number displays    |
| `heroLg`   | 28   | 34          | Bold     | Screen titles                    |
| `title`    | 22   | 28          | Semibold | Section headers                  |
| `headline` | 17   | 22          | Semibold | Card titles, list row primary    |
| `body`     | 17   | 22          | Regular  | Default body text                |
| `callout`  | 16   | 21          | Regular  | Secondary descriptions           |
| `subhead`  | 15   | 20          | Regular  | Supporting text, metadata        |
| `footnote` | 13   | 18          | Regular  | Timestamps, captions             |
| `caption`  | 12   | 16          | Regular  | Badges, labels, position tags    |
| `micro`    | 10   | 13          | Medium   | Card rank/suit on mini cards     |

### Monospace for Poker Notation

Hand ranges (`AKs`, `QQ+`, `T9o`) and board textures (`Ah Kd 7c`) use
monospace to maintain alignment and scannability.

```typescript
{
  fontFamily: 'monospace',
  fontSize: typography.body.size,
  letterSpacing: 0.5,
}
```

---

## 5. Spacing System

**Base unit:** 4px

| Name  | Value | Use                                          |
|-------|-------|----------------------------------------------|
| `2xs` | 2     | Tight internal padding (icon badges)         |
| `xs`  | 4     | Icon-to-text gaps, inline spacing            |
| `sm`  | 8     | Button internal padding, compact groups      |
| `md`  | 12    | Default gap between related elements         |
| `lg`  | 16    | Card padding, section gaps                   |
| `xl`  | 24    | Screen horizontal padding, section breaks    |
| `2xl` | 32    | Major section separators                     |
| `3xl` | 48    | Screen top/bottom safe area padding          |

### Spacing Rules

- **Screen horizontal padding:** 16-24px (lg to xl)
- **Card internal padding:** 16px (lg)
- **List row vertical padding:** 12px (md)
- **Action sheet padding:** 24px (xl)
- **Between form fields:** 12px (md)
- **Between section groups:** 24-32px (xl to 2xl)
- **Icon gap from text:** 8px (sm)

### Touch Targets

- **Minimum touch target:** 44 x 44 points (Apple HIG / Material)
- **Recommended touch target:** 48 x 48 points for primary actions
- **Action buttons (Fold/Check/Raise):** 56pt height minimum
- **Spacing between tappable elements:** minimum 8px gap to prevent mis-taps

---

## 6. Border Radius

| Name    | Value | Use                                  |
|---------|-------|--------------------------------------|
| `none`  | 0     | Dividers, full-width elements        |
| `sm`    | 6     | Badges, chips, small tags            |
| `md`    | 10    | Buttons, inputs, small cards         |
| `lg`    | 14    | Cards, list group containers         |
| `xl`    | 20    | Modal sheets, large containers       |
| `full`  | 9999  | Avatars, circular indicators, pips   |

### Playing Card Radius

Playing cards use `md` (10) for a realistic card feel. Mini cards in hand
ranges use `sm` (6).

---

## 7. Shadows and Elevation

React Native uses `shadowOffset`, `shadowRadius`, `shadowColor`, `shadowOpacity`
on iOS, and `elevation` on Android.

### Elevation Scale

```typescript
export const elevation = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  low: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.12,
    elevation: 4,
  },
  high: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.16,
    elevation: 8,
  },
}
```

| Level    | Use                                     |
|----------|-----------------------------------------|
| `none`   | Flat elements, list rows                |
| `low`    | Cards at rest, badges                   |
| `medium` | Floating action bar, active cards       |
| `high`   | Modal sheets, dragged elements          |

---

## 8. Animation and Motion

### Timing

| Duration | Use                                       |
|----------|-------------------------------------------|
| 100ms    | Press feedback (scale down)               |
| 200ms    | Toggle, selection change, color transition|
| 300ms    | Modal present/dismiss, screen transition  |
| 500ms    | Complex choreographed sequences           |

### Spring Physics

Use React Native Reanimated or the built-in `Animated` API with spring
configs for natural-feeling interactions.

```typescript
// Button press spring
const pressSpring = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
}

// Card flip / deal
const cardSpring = {
  damping: 20,
  stiffness: 200,
  mass: 1,
}

// Modal sheet slide
const sheetSpring = {
  damping: 25,
  stiffness: 250,
  mass: 1,
}
```

### Press Feedback Pattern

Every tappable element should provide press feedback:

```typescript
// Scale down on press, spring back on release
const pressScale = useSharedValue(1)

const onPressIn = () => {
  pressScale.value = withSpring(0.95, pressSpring)
}

const onPressOut = () => {
  pressScale.value = withSpring(1, pressSpring)
}
```

### Staggered List Entrance

When lists appear (hand history, player list), stagger item entrance:
- Delay: 50ms per item
- Duration: 200ms fade + translateY
- Max stagger: 8 items (cap to avoid slow loads)

---

## 9. Component Patterns

### Playing Card

The most important visual element. Cards must feel tactile and readable.

```
+--------+
| A      |     Standard card: ~60 x 84pt (5:7 ratio)
|   ♠    |     Mini card: ~32 x 45pt
|      A |     Radius: md (10)
+--------+     Shadow: elevation.low
```

- White/off-white background in both themes (cards are physical objects)
- Suit color from suit tokens
- Rank in top-left and bottom-right
- Monospace font for rank text
- Face-down cards use `surfaceSecondary` with a pattern or back design

### Hand Range Grid

A 13x13 grid showing hand combos. Each cell is colored by action frequency.

- Cell size: calculated from available width (screen width - 2 * horizontal padding) / 13
- Text: `caption` size, monospace
- Colors: action type colors at varying opacity to show frequency
- Selected cells get a border highlight

### Action Bar

The primary interaction point during hand review or training.

- Fixed to bottom of screen (above safe area)
- Three main buttons: Fold, Check/Call, Bet/Raise
- Each button uses its action type color
- Minimum height: 56pt per button
- Full width, divided equally with 8px gaps
- Press feedback with spring animation

### Position Badge

Small pill showing table position.

```typescript
{
  paddingHorizontal: spacing.sm,    // 8
  paddingVertical: spacing.xs,      // 4
  borderRadius: radii.sm,           // 6
  backgroundColor: positionColor + '26', // 15% opacity
}
```

Text uses the full-saturation position color, `caption` typography.

### Confidence Bar

Horizontal bar showing solver confidence for an action.

- Height: 6pt
- Border radius: `full`
- Background: `surfaceSecondary`
- Fill: confidence color token
- Animate width on appear (200ms, ease-out)

### List Row

Standard pattern for hand history, settings, navigation.

```typescript
{
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,    // 16
  paddingVertical: spacing.md,      // 12
  backgroundColor: theme.surfacePrimary,
  minHeight: 44,                    // Touch target
}
```

- Chevron indicator for navigation rows
- Swipe actions where appropriate (delete hand, bookmark)
- Separator between rows: 1px `borderSubtle`, inset from left

### Chat Bubble (GTO Assistant)

For the AI assistant conversation interface.

```
User bubble:                     Assistant bubble:
  Right-aligned                  Left-aligned
  accentPrimary background       surfaceSecondary background
  White text                     textPrimary text
  radius: lg (14)                radius: lg (14)
  Max width: 80% screen          Max width: 80% screen
```

- Tail on the corner closest to the sender
- Markdown rendering for assistant responses (hand notation, ranges)
- Code blocks use monospace with `surfacePrimary` background

### Bottom Sheet / Action Sheet

Modal content rising from the bottom.

- Handle indicator: 36 x 5pt, `borderSubtle` color, centered, `full` radius
- Top padding: 8pt above handle, 16pt below
- Content padding: 24pt horizontal
- Background: `surfaceElevated`
- Corner radius: `xl` (20) on top corners only
- Spring animation for open/close
- Backdrop: `rgba(0,0,0,0.4)` light / `rgba(0,0,0,0.6)` dark

### Segmented Control

For switching between views (e.g., Preflop / Flop / Turn / River).

- Background: `surfaceSecondary`
- Selected segment: `surfacePrimary` with `elevation.low`
- Height: 36pt
- Corner radius: `md` (10)
- Animated sliding selection indicator

---

## 10. Layout Patterns

### Screen Structure

```
SafeAreaView
  ScrollView (or FlatList)
    Header section
    Content sections (cards, lists, grids)
  Fixed bottom bar (if needed)
```

- Always use `SafeAreaView` or safe area insets
- Horizontal screen padding: `spacing.lg` (16) to `spacing.xl` (24)
- Use `flex: 1` for main content to fill available space

### Navigation

- Stack navigator for drill-down flows
- Tab navigator for top-level sections
- Bottom sheet for contextual actions (not full screen navigation)

### Keyboard Handling

- `KeyboardAvoidingView` for screens with inputs
- Bet sizing input should remain visible when keyboard opens
- Dismiss keyboard on background tap

---

## 11. Iconography

- Use a consistent icon library (e.g., `@expo/vector-icons` or custom SVGs)
- Icon size: 20-24pt for navigation, 16pt inline with text
- Icon color: `textSecondary` default, `textPrimary` when active
- Tappable icons must have a 44pt minimum hit area (pad with transparent area)
- Always provide `accessibilityLabel` for icon-only buttons

---

## 12. Accessibility

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- All interactive elements must be reachable via screen reader
- Use `accessibilityRole`, `accessibilityLabel`, `accessibilityState`
- Playing cards must announce rank and suit (e.g., "Ace of Spades")
- Action buttons must announce the action and amount
- Respect system font size preferences (`allowFontScaling`)
- Respect reduced motion preference (`useReducedMotion` from Reanimated)
  - When active, replace spring animations with instant value changes
  - Keep layout shifts but remove decorative motion

---

## 13. Anti-Patterns

### NEVER Do

- Hardcoded colors (`'#fff'`, `'white'`) -- use theme tokens
- `StyleSheet.absoluteFill` without safe area consideration
- Inline style objects in render (create with `StyleSheet.create` or memoize)
- Fixed pixel dimensions that ignore screen size
- Text smaller than 10pt (unreadable on mobile)
- Touch targets smaller than 44pt
- Horizontal scrolling without clear affordance
- Nested ScrollViews in the same direction

### ALWAYS Do

- Theme tokens for all colors
- `StyleSheet.create()` for static styles
- `accessibilityLabel` on icon-only buttons
- Test in both light and dark modes
- Test with system large text enabled
- Provide press feedback on all tappable elements
- Use `elevation` for Android shadow compatibility
- Handle safe area insets on all screens

---

## 14. File Organization

```
src/
  theme/
    tokens.ts          -- Color, spacing, typography, shadow tokens
    light.ts           -- Light theme object
    dark.ts            -- Dark theme object
    index.ts           -- ThemeProvider, useTheme hook
  components/
    Card/
      Card.tsx
      Card.styles.ts   -- StyleSheet.create({...})
    ActionBar/
      ActionBar.tsx
      ActionBar.styles.ts
```

### Style File Convention

- Style files use `.styles.ts` suffix
- One `StyleSheet.create()` call per file
- Export a function that takes theme and returns styles for themed components

```typescript
// Card.styles.ts
import { StyleSheet } from 'react-native'
import type { Theme } from '@/theme'

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfacePrimary,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.low,
    },
  })
```

---

## Quick Reference Card

**Aesthetic:** Refined Minimalism -- sleek, clean, engaging
**Platform:** React Native / Expo
**Theme mode:** Dark-first, verify light
**Colors:** `theme.colors.tokenName` (never hardcoded)
**Spacing base:** 4px (2, 4, 8, 12, 16, 24, 32, 48)
**Touch target:** 44pt minimum, 48pt recommended
**Typography:** System fonts, 10-34pt scale
**Card radius:** 10pt (md)
**Action buttons:** 56pt height, full width, action-type colors
**Animations:** Spring physics via Reanimated, 200ms interactions
**Suits:** Black spades/clubs, red hearts, blue diamonds
**Press feedback:** Scale to 0.95 with spring return
**Styles:** `StyleSheet.create()` in `.styles.ts` files
**Accessibility:** 4.5:1 contrast, screen reader labels, respect reduced motion
