# Cat Box Packing - Progress Tracker

## PRD Incomplete Tasks

### ✅ Task 1: Shade area covered by placed cat
- **Goal:** Add shading where a cat placed in the box has covered each cell so the user can see the remaining open cells.
- **Status:** Completed
- **Changes:**
  - Shade overlay rendered in `src/screens/GameScreen.tsx` over every cell occupied by a
    placed cat, using `getOccupiedCells(shapeMatrix, currentPosition)` + a translucent
    `shadedCell` style, so remaining open cells stay clearly visible.
  - Overlay is absolutely positioned relative to the board and re-renders as cats are
    placed/unplaced (driven by `placedCats` from `useGameState`).
  - `src/components/Board.tsx` restored to the clean grid renderer (`BoxTile` + `onGridMeasured`).

### ✅ Task 2: Center unpacked cats and associated image
- **Goal:** Image of cat and associated blocks remain centered at placed location in unpacked area such that rotating cat does not change image location.
- **Status:** Completed
- **Changes:**
  - Added `TRAY_SLOT_WIDTH` / `TRAY_SLOT_HEIGHT` constants describing the tray slot grid.
  - `DraggableCatPiece` (in `GameScreen.tsx`) now anchors each unpacked cat on the CENTER of
    its tray slot via `trayCenter` + `getTrayHome()`, so the piece bounding box (blocks) is
    centered at the slot location regardless of orientation.
  - Initial placement, snap-to-rest, and the drop-outside-board fallback all use the centered
    home position; re-snapping happens automatically on rotation (`shapeMatrix` change).
  - `CatSprite` keeps the image centered inside the piece and rotates about the image's own
    center, so the image stays put while a rotatable cat (Stretching/Loaf) is rotated.

## Current Status: Baseline Assessment

## Current Status: Baseline Assessment

### ✅ Implemented Features
- Grid system with mask support for irregular shapes
- Grid occupancy collision detection
- Staging area (tray) at bottom of screen
- Cat types: Kitten, Sitting, Stretching, Curl, Loaf
- Cat rotation (all cats currently rotatable)
- Boredom timer with random cat ejection
- 10 handcrafted levels (1-10)
- Level select screen with progress persistence
- Home screen with navigation
- Splash screen
- Audio effects (meow, purr, click)
- Background image
- Cardboard box visual with flaps
- Cat sprites with breed colors
- Level completion modal with star display
- Progress saving via AsyncStorage

### ✅ Item 7 — Statistics and Metrics (Firebase Analytics)
- **Firebase config** centralized in `GoogleService-Info.plist` and read via `src/services/firebaseConfig.ts` (embedded plist parser)
- **Gameplay duration** per installation: min / max / average session time (`src/services/analytics`)
- **Level interactions** per level per installation: min / max / average count of drag&drop + rotate (`mergeLevelSample`)
- **Sessions** per installation: total count + bounded session history
- **Retention** per installation: D1 / D2 / D7 / D14 / D30 with maturity flags
- **Level Completion** per installation: completed-level count + per-level completion times
- **Anonymous Firebase collection**: Firebase Auth anonymous `accounts:signUp` → id token → Firestore `documents:commit` push into `catBoxAnalytics/installations/{installationId}` (`src/services/analytics/firebaseClient.ts`)
- **Session lifecycle wiring**: `App.tsx` (start/touch/end + periodic flush), `GameScreen.tsx` (interaction + attempt + completion tracking)
- **Tests**: `npm run test:analytics` (integration test with mocked store/fetch) + smoke tests of the pure aggregation logic
- Verified: TypeScript typecheck ✅ passing

### ❌ Missing / Incomplete Features (PRD Gaps)
1. **Standing Cat pose** - Missing from CatPose type and CAT_SHAPES
2. **isAwake logic** - Currently `pose !== 'sitting'`, should be `pose !== 'curl'` (only Curl Sleeping Cat is asleep)
3. **Catnip Toy obstacle** - Missing entirely (disables boredom timer of adjacent awake cats)
4. **Cucumber obstacle** - Missing entirely (blocks cells, only sleeping cats adjacent)
5. **Time-based scoring** - No timer, no target time, no score formula
6. **Star rating system** - Currently jumpOut-based, should be time-based (3★ under target, 2★ within 1.5x, 1★ completed)
7. **20 levels** - Only 10 exist, need 10 more (11-20)
8. **Mouse distraction** - Missing (random event that makes all cats jump out)
9. **Rotation restriction** - Only Stretching and Loaf should be rotatable
10. **Timer display in UI** - Missing from HUD
11. **Obstacle rendering** - No visual for Catnip/Cucumber in Board

### Level Progression Status
| Levels | Status | Notes |
|--------|--------|-------|
| 1-5 | ✅ | Tutorial & Intro (small grids, simple shapes) |
| 6-10 | ✅ | Intermediate (irregular shapes, sleeping cats) |
| 11-15 | ❌ | Obstacles Introduced (Standing Cats, Catnip, Cucumbers) |
| 16-20 | ❌ | Master Levels (tight grids, fast timers, multi-obstacles) |

### Build Status
- TypeScript typecheck: ✅ Passing