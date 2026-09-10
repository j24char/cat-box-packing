# Product Requirements Document (PRD)

**Project Name:** Cat Box Packing  
**Document Version:** 1.0  
**Status:** Draft / Conceptual  

---

## 1. Executive Summary
**Cat Box Packing** is a 2D grid-based spatial puzzle game where players must strategically fit cats of various shapes into a defined box grid. As levels progress, board shapes grow more complex, obstacles are introduced, and cat behaviors (like boredom and movement) add dynamic challenge. The ultimate objective is to fit all required cats into the box in the shortest time possible across 20 progressively harder levels.

---

## 2. Core Gameplay & Mechanics

### 2.1 Object & Board Mechanics
* **Grid System:** Each level presents a bounded grid representing a "Box." Grid dimensions and shape layouts vary per level (e.g., standard rectangles, L-shapes, or irregular grids).
* **Grid Occupancy:** Each cell in the box can be occupied by at most one cat tile or standard static obstacle.
* **Staging Area:** Area at bottom of the screen that contains the cats to be placed into the "Box"

### 2.2 Cat Types & Shapes
Cats act as piece shapes (similar to Polyominoes/Tetris blocks) made up of specific cell dimensions:

| Cat Type | Grid Matrix | Total Cells | Behavior / Attributes |
| :--- | :--- | :--- | :--- |
| **Kitten** | `[1][1]` | 1 | Smallest unit piece. |
| **Sitting Cat** | `[2][1]` | 2 | Compact piece. |
| **Stretching Cat** | `[2][1][1]` | 4 | L-shaped piece. |
| **Curl Sleeping Cat** | `[2][2]` | 4 | 2x2 square block. *Passive (stays asleep).* |
| **Standing Cat** | `[2][2][2]` | 6 | Large block piece. |
| **Loaf Cat** | `[4][1]` | 4 | Long piece. |

*Note: Stretching and Loaf Cats can be rotated in 90-degree increments prior to placement.*

### 2.3 Nuances & Obstacles
* **Boredom Timer (Awake Cats):** 
  * Cats that are awake (all types except *Curl Sleeping Cat*) have a limited boredom threshold once placed.
  * If a placed awake cat remains in the box while the puzzle isn't fully solved within $N$ seconds, it will jump out of the box back to the staging area, requiring the player to re-place it.
* **Cell Obstacles:**
  * **Catnip Toy:** Fills a cell; disables the boredom timer of adjacent awake cats.
  * **Cucumber:** Blocks a cell completely (only sleeping cats can be placed adjacent to cucumbers).
* **Distraction (Awake Cats):**
  * **Mouse:** Animation that may randomly triggers; all cats jump out of the box to chase, returning the cats to the unpacked area.

---

## 3. Level Design & Progression

The game consists of **20 static levels** designed with a progressive difficulty curve. The cats provided in the unpacked area for each level must be able to fit into the box with the obstacles.

* **Levels 1–5 (Tutorial & Intro):** Small grids ($3 \times 3$ to $4 \times 4$), simple shapes (Kittens, Sitting Cats), no obstacles, long/infinite boredom timers.
* **Levels 6–10 (Intermediate Shapes):** Irregular box shapes, introduction of Sleeping Cats and Stretching Cats, generous boredom timers.
* **Levels 11–15 (Obstacles Introduced):** Introduction of Standing Cats, Catnip Toys, and Cucumbers blocking optimal placement paths.
* **Levels 16–20 (Master Levels):** Tight grid footprints, fast boredom timers, multi-obstacle layouts requiring rapid execution.

---

## 4. Scoring & Time Mechanics

* **Base Completion:** Successfully placing all required cats into the box without any cat jumping out completes the level.
* **Time-Based Scoring:**
  * Each level has a Target Completion Time ($T_{target}$).
  * Score Formula: $\text{Score} = \text{Base Points} + \max(0, (T_{target} - T_{elapsed}) \times \text{Multiplier})$.
* **Star Rating System:**
  * **3 Stars:** Solved under target time $T_{target}$.
  * **2 Stars:** Solved within $1.5 \times T_{target}$.
  * **1 Star:** Level completed regardless of time.

---

## 5. Visuals & UI Guidelines (Placeholder Stage)

Since final artwork will be added later, the prototype must rely on structured graphical placeholders:

* **Grid & Box Boundary:** Rendered using crisp 2D line borders and background tile grids.
  * **Shadow:** Cats placed into the box will shade the cells that are covered by that cat.
* **Cat Pieces:** Geometric shapes matching the cell dimensions - they will shade out the cells they consume when a cat is dropped in the box.
  * *Pose:* Determines the cells used by the shape of the cat (e.g., `"kitten"`, `"curl"`, `"sitting"`, `"stretch"`, `"loaf"`, `"standing"`).
  * *Breed:* Determines the artwork associated with each cat (e.g., `"calico"`, `"tabby"`, `"siamese"`, `"silver"`, `"tuxedo"`, `"black"`).
  * **Image: ** An image is associated with each cat type and breed. The image is centered on the cells associated with the cat.
* **Unpacked Area:** Rendered using crisp 2D line borders. Cats here are evenly spaced horizontally and shown at 50% size until selected.
  * **Location:** Cats in unpacked area are evenly spaced horizontally so all cats are accessible for drag and drop.
  * **Size:** Cats in unpacked area are displayed at 50% size until selected or placed.
  * **Rotate:** Cats in unpacked area that may be rotated will rotate when tapped, but remain centered on the placed location in unpacked area.
* **Obstacles:**
  * **Cucumber:** Green oval in a cell.
  * **Catnip:** Blue circle in a cell.
* **UI Overlay:** Level Number and Timer at top-center, Exit Button at top-left, and Reset Level Button at top-right.
* **Background:** a cute niche background image to add to the cozy feel of the game

---

## 6. Technical & System Architecture

* **Collision Engine:** Grid-matching check ensuring no overlapping cells. Placements outside the box boundary move the dropped cat back to unpacked area.

---

## 7. Statistics and Metrics

* **Analytics collection:** Use Firebase analytics to collect anonymous information. Firebase info stored in GoogleService-Info.plist
  * **Background collection:** None of the analytics should be visible to the user/player of the game. 
  * **Gameplay duration:** Track for each installation: max time used per session, min time used per session, average time used per session.
  * **Level interactions:** Track the min/max/average number of interactions (drag&drop, rotate) at each level (to be reported for each level) for each installation.
  * **Sessions:** Track the number of sessions per installation.
  * **Retention:** Track D1 retention, D2 retention, D7 retention, D14 retention, D30 retention.
  * **Level Completion** Track the number of levels completed per installation.