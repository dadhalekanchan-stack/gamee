# ARCHITECTURE SPECIFICATION: Academia 2D RPG
> **Codex Prime Directive** — This document is the **single and absolute source of truth** for the Academia project.
> - Implement **every file, function, route, column, and behavior** described here exactly as written.
> - Do **not** invent names, structures, or logic that contradict this document.
> - Do **not** skip sections. Do **not** combine unrelated implementation steps.
> - When a section says "exact name", the string is a contract — do not rename it.
> - If something is ambiguous, re-read the nearest Codex Instruction block before asking.
> - Prefer explicit over clever. Prefer readable over terse.

---

**Author:** Yash Sawalakhe
**Degree:** BCA 3rd Year Final Project
**Version:** 3.0 (Codex-Prime — Zero Ambiguity Edition)
**Core Concept:** 2D Tile-Based Educational RPG — Tall Grass Practice → Gym Boss Assessment
**Tech Stack:** Next.js 14 (App Router) · Node.js/Express · Phaser 3 · Supabase (PostgreSQL)
**Architecture Pattern:** Client-Server · REST API · Scene-State-Driven Game Loop

---

## TABLE OF CONTENTS

1. [System Overview & Data Flow](#1-system-overview--data-flow)
2. [Monorepo Directory Structure](#2-monorepo-directory-structure)
3. [Environment Variables](#3-environment-variables)
4. [Constants & Shared Configuration](#4-constants--shared-configuration)
5. [Database Schema (PostgreSQL — 3NF)](#5-database-schema-postgresql--3nf)
6. [Full Question Bank Seed Data](#6-full-question-bank-seed-data)
7. [Server: Express API Specification](#7-server-express-api-specification)
8. [Client: Next.js Application](#8-client-nextjs-application)
9. [Phaser 3 Game Engine — Scene Architecture](#9-phaser-3-game-engine--scene-architecture)
10. [Authentication Flow](#10-authentication-flow)
11. [Game State Management](#11-game-state-management)
12. [Asset Manifest](#12-asset-manifest)
13. [Error Handling Contract](#13-error-handling-contract)
14. [Known Gotchas & Codex Warnings](#14-known-gotchas--codex-warnings)
15. [Setup & Run Instructions](#15-setup--run-instructions)
16. [Deployment Guide](#16-deployment-guide)
17. [Codex Implementation Checklist](#17-codex-implementation-checklist)

---

## 1. System Overview & Data Flow

Academia is a browser-based, tile-driven RPG where PCM (Physics, Chemistry, Mathematics) knowledge is the player's combat mechanic. Wrong answers = HP loss. Correct answers = EXP gain. Gym leaders = chapter bosses gated by minimum level.

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                       │
│                                                             │
│   ┌──────────────┐        ┌──────────────────────────────┐  │
│   │   Next.js    │        │       Phaser 3 Canvas        │  │
│   │  (React UI)  │◄──────►│  BootScene → WorldScene →   │  │
│   │              │        │  BattleScene → WorldScene    │  │
│   │  Auth Pages  │        │                              │  │
│   │  Dashboard   │        │  Local State: HP, Position,  │  │
│   │  HUD Overlay │        │  Active Zone, Scene Flags    │  │
│   └──────┬───────┘        └──────────────┬───────────────┘  │
│          │                               │                  │
└──────────┼───────────────────────────────┼──────────────────┘
           │  HTTP/REST (fetch)            │  HTTP/REST (fetch)
           ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js / Express Server  (Port 5000)         │
│                                                             │
│   /api/auth/*          → Auth Controller                    │
│   /api/encounters      → Encounter Controller               │
│   /api/battle/evaluate → Battle Controller                  │
│   /api/player/sync     → Player Controller                  │
│   /api/player/:id      → Player Controller                  │
│   /api/badges/:id      → Badge Controller                   │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │  pg (node-postgres)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase — PostgreSQL Database                │
│                                                             │
│   players · questions · player_badges                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Game Loop — State Machine

```
[Login Page]
     │
     ▼
[Dashboard — shows Level, EXP bar, Badges earned]
     │  User clicks "Play"
     ▼
[GameWrapper mounts Phaser canvas — dynamic import]
     │
     ▼
[BootScene] → Preloads all assets with progress bar → starts WorldScene
     │
     ▼
[WorldScene — Exploration]
     │
     ├─── Player walks into TallGrass tile
     │         │
     │         ▼  Math.random() < 0.02 per frame while moving in grass
     │    [RNG Trigger] → scene.start('BattleScene', { zone, difficulty: 'basic', is_gym_battle: false })
     │
     └─── Player overlaps GymZone trigger
               │
               ├── level < 3 → showFloatingText('Level 3 required!', red)
               │
               └── level >= 3 → scene.start('BattleScene', { zone, difficulty: 'intermediate', is_gym_battle: true })

[BattleScene — Combat]
     │
     ├── fetch GET /api/encounters?zone=&difficulty=
     │
     ├── Render MCQ UI (question + 4 option buttons in 2×2 grid)
     │
     ├── Player clicks OR uses arrow keys + Enter to select
     │         │
     │         ▼ POST /api/battle/evaluate
     │
     ├── correct: true  → Green highlight → EXP feedback → optional level-up/badge anim → return WorldScene after 2.5s
     │
     └── correct: false → Red highlight → screen shake → HP deduct → return WorldScene (or GameOver if hp ≤ 0)
```

### 1.3 Zone Map

The game has 3 subject zones. Each zone has its own area on the world tilemap, its own tall grass, and its own gym.

| Zone Key         | Subject     | Gym Min Level | Basic EXP | Gym EXP |
|-----------------|-------------|--------------|-----------|---------|
| `physics_town`  | Physics     | 3            | 10        | 100     |
| `math_town`     | Mathematics | 5            | 10        | 100     |
| `chem_town`     | Chemistry   | 7            | 10        | 100     |

---

## 2. Monorepo Directory Structure

> **Codex Instruction:** Create every file and folder listed below. Files that contain logic are specified in later sections. Files marked `// TODO` should contain that comment plus a description of their purpose at the top.

```
/academia-rpg
│
├── /client                               # Next.js 14 (App Router)
│   ├── .env.local                        # NEXT_PUBLIC_API_BASE_URL
│   ├── next.config.js                    # Transpile Phaser, image domains
│   ├── package.json
│   ├── tailwind.config.js
│   │
│   ├── /public
│   │   └── /assets
│   │       ├── /tilemaps
│   │       │   └── world.json            # Tiled map export — see Section 12
│   │       ├── /tilesets
│   │       │   └── tileset.png           # 16×16 tile spritesheet
│   │       ├── /sprites
│   │       │   └── player.png            # 4-dir walk spritesheet (12 frames)
│   │       └── /ui
│   │           ├── battle_bg.png         # 800×600 battle background
│   │           └── hud_frame.png         # HUD border (optional decoration)
│   │
│   └── /src
│       ├── /app
│       │   ├── layout.js                 # Root layout — imports Press Start 2P font
│       │   ├── page.js                   # "/" → redirect logic
│       │   ├── /login
│       │   │   └── page.js
│       │   ├── /register
│       │   │   └── page.js
│       │   └── /dashboard
│       │       └── page.js               # Protected — redirect if no token
│       │
│       ├── /components
│       │   ├── LoginForm.jsx
│       │   ├── RegisterForm.jsx
│       │   ├── Dashboard.jsx
│       │   ├── GameWrapper.jsx           # Phaser lifecycle bridge
│       │   └── HUD.jsx                   # React overlay on Phaser canvas
│       │
│       ├── /game                         # Pure Phaser 3 — NO React imports
│       │   ├── constants.js              # Zone list, level thresholds, damage values
│       │   ├── config.js                 # Phaser.Game config object
│       │   ├── BootScene.js
│       │   ├── WorldScene.js
│       │   └── BattleScene.js
│       │
│       ├── /context
│       │   └── PlayerContext.jsx
│       │
│       ├── /hooks
│       │   └── usePlayer.js
│       │
│       └── /lib
│           └── api.js                    # All fetch() wrappers — no raw fetch elsewhere
│
├── /server                               # Node.js + Express
│   ├── .env
│   ├── package.json
│   ├── index.js                          # Entry point
│   │
│   ├── /db
│   │   ├── pool.js                       # pg Pool + query helper + init()
│   │   └── schema.sql                    # All CREATE TABLE + full seed data
│   │
│   ├── /routes
│   │   ├── auth.routes.js
│   │   ├── encounter.routes.js
│   │   ├── battle.routes.js
│   │   └── player.routes.js
│   │
│   ├── /controllers
│   │   ├── auth.controller.js
│   │   ├── encounter.controller.js
│   │   ├── battle.controller.js
│   │   └── player.controller.js
│   │
│   └── /middleware
│       ├── validate.js                   # express-validator helpers
│       └── auth.middleware.js            # JWT verification middleware
│
└── ARCHITECTURE.md
```

---

## 3. Environment Variables

### 3.1 `/server/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Auth
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# CORS
CLIENT_ORIGIN=http://localhost:3000
```

### 3.2 `/client/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

> **Codex Instruction:** Never hardcode these values in source files. Always read from `process.env`. In Phaser scenes, access via `process.env.NEXT_PUBLIC_API_BASE_URL` (Next.js inlines public env vars at build time).

---

## 4. Constants & Shared Configuration

### 4.1 `/client/src/game/constants.js`

> **Codex Instruction:** Create this file. Import from it wherever these values are needed in Phaser scenes. Do not hardcode these values inline in scene files.

```javascript
// /client/src/game/constants.js

export const ZONES = {
  PHYSICS: 'physics_town',
  MATH: 'math_town',
  CHEM: 'chem_town',
}

export const ZONE_LABELS = {
  physics_town: 'Physics Town',
  math_town:    'Math Town',
  chem_town:    'Chemistry Town',
}

// Minimum level required to enter each gym
export const GYM_LEVEL_REQUIREMENT = {
  physics_town: 3,
  math_town:    5,
  chem_town:    7,
}

// EXP thresholds to reach level N+1
// Formula: threshold(n) = n * (n + 1) / 2 * 100
export const LEVEL_THRESHOLDS = {
  1:  100,
  2:  300,
  3:  600,
  4:  1000,
  5:  1500,
  6:  2100,
  7:  2800,
  8:  3600,
  9:  4500,
  10: Infinity, // Level cap
}

export const MAX_LEVEL = 10

// EXP rewards
export const EXP_BASIC   = 10   // Tall grass encounter win
export const EXP_GYM     = 100  // Gym battle win

// HP values
export const HP_MAX     = 100
export const HP_DAMAGE  = 20    // HP lost per wrong answer

// Grass encounter probability per frame while moving in tall grass
export const GRASS_ENCOUNTER_CHANCE = 0.02

// Player movement speed (pixels/second)
export const PLAYER_SPEED = 100

// Post-battle cooldown duration (ms) before grass can trigger again
export const BATTLE_COOLDOWN_MS = 2000

// Phaser canvas dimensions
export const CANVAS_WIDTH  = 800
export const CANVAS_HEIGHT = 600
```

---

## 5. Database Schema (PostgreSQL — 3NF)

> **Codex Instruction:** Place this exactly as `/server/db/schema.sql`. The file must be idempotent — use `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for seed inserts. The server's `db/pool.js` `init()` function must execute this file on startup using `fs.readFileSync` + `pool.query`.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- TABLE 1: players
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,            -- bcrypt hash, NEVER plain text
    level       INTEGER      NOT NULL DEFAULT 1,
    exp         INTEGER      NOT NULL DEFAULT 0,
    hp          INTEGER      NOT NULL DEFAULT 100,
    max_hp      INTEGER      NOT NULL DEFAULT 100,
    map_x       INTEGER      NOT NULL DEFAULT 400,
    map_y       INTEGER      NOT NULL DEFAULT 300,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- TABLE 2: questions
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id              SERIAL       PRIMARY KEY,
    zone            VARCHAR(50)  NOT NULL,
    difficulty      VARCHAR(20)  NOT NULL
                    CHECK (difficulty IN ('basic', 'intermediate')),
    subject         VARCHAR(30)  NOT NULL,
    question_text   TEXT         NOT NULL,
    options         JSONB        NOT NULL,         -- Exactly 4 strings: ["A","B","C","D"]
    correct_idx     INTEGER      NOT NULL
                    CHECK (correct_idx BETWEEN 0 AND 3),
    explanation     TEXT,                          -- Shown after answer in BattleScene
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_zone_diff
    ON questions (zone, difficulty);

-- ─────────────────────────────────────────────────────────
-- TABLE 3: player_badges
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_badges (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    badge_name  VARCHAR(100) NOT NULL,
    zone        VARCHAR(50)  NOT NULL,
    earned_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, badge_name)
);
```

---

## 6. Full Question Bank Seed Data

> **Codex Instruction:** Append ALL of the following INSERT statements to the bottom of `/server/db/schema.sql`, after the table definitions. Every INSERT must use `ON CONFLICT DO NOTHING`. There must be at least 10 questions per zone per difficulty (10 × 3 zones × 2 difficulties = 60 minimum). All questions below are already at that count. Do not truncate or abbreviate them.

```sql
-- ─────────────────────────────────────────────────────────
-- SEED: PHYSICS TOWN — BASIC (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('physics_town','basic','Physics',
 'What is the SI unit of force?',
 '["Newton","Joule","Watt","Pascal"]',0,
 'Force = mass × acceleration. The SI unit is Newton (N).'),

('physics_town','basic','Physics',
 'Which law states that every action has an equal and opposite reaction?',
 '["Newton''s First Law","Newton''s Second Law","Newton''s Third Law","Law of Gravitation"]',2,
 'Newton''s Third Law of Motion.'),

('physics_town','basic','Physics',
 'What is the SI unit of energy?',
 '["Watt","Newton","Joule","Pascal"]',2,
 'Energy is measured in Joules (J = kg·m²/s²).'),

('physics_town','basic','Physics',
 'Which quantity has both magnitude and direction?',
 '["Speed","Distance","Mass","Velocity"]',3,
 'Velocity is a vector quantity — it has both magnitude and direction.'),

('physics_town','basic','Physics',
 'A car travels 100 km in 2 hours. What is its average speed?',
 '["25 km/h","50 km/h","100 km/h","200 km/h"]',1,
 'Speed = Distance / Time = 100 / 2 = 50 km/h.'),

('physics_town','basic','Physics',
 'What is the value of acceleration due to gravity (g) near Earth''s surface?',
 '["8.9 m/s²","9.8 m/s²","10.8 m/s²","11.2 m/s²"]',1,
 'Standard value of g ≈ 9.8 m/s² (often approximated as 10 m/s²).'),

('physics_town','basic','Physics',
 'Which of these is a scalar quantity?',
 '["Force","Acceleration","Temperature","Displacement"]',2,
 'Temperature has only magnitude, no direction — it is a scalar.'),

('physics_town','basic','Physics',
 'What is the unit of electric current?',
 '["Volt","Ohm","Ampere","Watt"]',2,
 'Electric current is measured in Amperes (A).'),

('physics_town','basic','Physics',
 'According to Newton''s First Law, a body at rest remains at rest unless acted upon by a:',
 '["Balanced force","Net zero force","Non-zero external force","Gravitational force only"]',2,
 'Newton''s First Law — the law of inertia. An unbalanced (non-zero net) external force is required to change the state of rest.'),

('physics_town','basic','Physics',
 'Ohm''s Law states that V = ?',
 '["I / R","I + R","I × R","I² × R"]',2,
 'Ohm''s Law: Voltage (V) = Current (I) × Resistance (R).')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SEED: PHYSICS TOWN — INTERMEDIATE (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('physics_town','intermediate','Physics',
 'A body moves in a circle of radius r with speed v. Its centripetal acceleration is:',
 '["v/r","v²/r","r/v²","vr"]',1,
 'Centripetal acceleration a = v²/r.'),

('physics_town','intermediate','Physics',
 'The work done by a force F over displacement d at angle θ is:',
 '["F × d","F × d × sin θ","F × d × cos θ","F / d"]',2,
 'W = F·d·cos θ. Work is the dot product of force and displacement vectors.'),

('physics_town','intermediate','Physics',
 'A projectile is launched at 45°. Which angle gives maximum range on flat ground?',
 '["30°","45°","60°","90°"]',1,
 'Range is maximized at 45° because sin(2θ) is maximum at θ = 45°.'),

('physics_town','intermediate','Physics',
 'Two objects of mass 2 kg and 4 kg are connected by a string over a frictionless pulley. The acceleration of the system is: (g = 10 m/s²)',
 '["10/3 m/s²","5/3 m/s²","20/6 m/s²","3.33 m/s²"]',0,
 'a = (m2 - m1)g / (m1 + m2) = (4-2)×10 / (2+4) = 20/6 ≈ 3.33 m/s². All listed options equal the same value; correct_idx=0.'),

('physics_town','intermediate','Physics',
 'A spring of spring constant k is stretched by x. The potential energy stored is:',
 '["kx","½kx","kx²","½kx²"]',3,
 'Elastic PE = ½kx².'),

('physics_town','intermediate','Physics',
 'What is the escape velocity from Earth''s surface? (g=9.8 m/s², R=6.4×10⁶ m)',
 '["7.9 km/s","11.2 km/s","15.0 km/s","3.2 km/s"]',1,
 'Escape velocity v = √(2gR) ≈ 11.2 km/s.'),

('physics_town','intermediate','Physics',
 'A wave has frequency 500 Hz and wavelength 0.68 m. Its speed is:',
 '["340 m/s","500 m/s","0.68 m/s","735 m/s"]',0,
 'v = fλ = 500 × 0.68 = 340 m/s (speed of sound in air).'),

('physics_town','intermediate','Physics',
 'The moment of inertia of a solid sphere about its diameter is:',
 '["½mr²","⅔mr²","⅖mr²","mr²"]',2,
 'I = (2/5)mr² for a solid sphere about a diameter.'),

('physics_town','intermediate','Physics',
 'Electric field due to a point charge Q at distance r is:',
 '["kQ/r","kQ/r²","kQ²/r","kQ/r³"]',1,
 'E = kQ/r² by Coulomb''s law (k = 1/4πε₀).'),

('physics_town','intermediate','Physics',
 'The phenomenon of light bending around corners is called:',
 '["Reflection","Refraction","Diffraction","Polarization"]',2,
 'Diffraction is the bending of waves around obstacles or through slits.')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SEED: MATH TOWN — BASIC (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('math_town','basic','Mathematics',
 'What is the derivative of sin(x)?',
 '["cos(x)","-cos(x)","sin(x)","-sin(x)"]',0,
 'd/dx [sin(x)] = cos(x).'),

('math_town','basic','Mathematics',
 'What is the integral of cos(x)?',
 '["-sin(x)","sin(x)","tan(x)","cos(x)"]',1,
 '∫cos(x)dx = sin(x) + C.'),

('math_town','basic','Mathematics',
 'What is log₁₀(100)?',
 '["1","2","10","100"]',1,
 'log₁₀(100) = log₁₀(10²) = 2.'),

('math_town','basic','Mathematics',
 'The sum of angles in a triangle is:',
 '["90°","180°","270°","360°"]',1,
 'Sum of interior angles of any triangle = 180°.'),

('math_town','basic','Mathematics',
 'What is the value of sin(30°)?',
 '["√3/2","1/2","1","√2/2"]',1,
 'sin(30°) = 1/2.'),

('math_town','basic','Mathematics',
 'If f(x) = 3x² + 2x + 1, what is f''(x)?',
 '["3x + 2","6x + 2","6x² + 2","3x² + 2"]',1,
 'f''(x) = 6x + 2 by the power rule.'),

('math_town','basic','Mathematics',
 'What is the slope of the line y = 4x - 7?',
 '["-7","4","7","-4"]',1,
 'In y = mx + c, m is the slope. Here m = 4.'),

('math_town','basic','Mathematics',
 'The number of ways to arrange 4 distinct books on a shelf is:',
 '["4","16","24","256"]',2,
 '4! = 4 × 3 × 2 × 1 = 24.'),

('math_town','basic','Mathematics',
 'What is the area of a circle with radius 7?',
 '["22π","44π","49π","14π"]',2,
 'Area = πr² = π × 49 = 49π.'),

('math_town','basic','Mathematics',
 'Solve: 2x + 5 = 13. What is x?',
 '["3","4","5","6"]',1,
 '2x = 8 → x = 4.')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SEED: MATH TOWN — INTERMEDIATE (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('math_town','intermediate','Mathematics',
 'What is ∫₀¹ x² dx?',
 '["1/2","1/3","1/4","2/3"]',1,
 '∫x² dx = x³/3. Evaluated 0 to 1 = 1/3 - 0 = 1/3.'),

('math_town','intermediate','Mathematics',
 'The general solution to dy/dx = y is:',
 '["y = x + C","y = Ce^x","y = Cx","y = ln(x) + C"]',1,
 'Separable ODE: dy/y = dx → ln|y| = x + C → y = Ce^x.'),

('math_town','intermediate','Mathematics',
 'What is the determinant of the matrix [[2,3],[1,4]]?',
 '["5","8","11","14"]',0,
 'det = (2×4) - (3×1) = 8 - 3 = 5.'),

('math_town','intermediate','Mathematics',
 'The sum of an infinite GP with first term a and ratio r (|r|<1) is:',
 '["a/(1+r)","a/(1-r)","a×r","a(1-r)"]',1,
 'Sum∞ = a / (1 - r) for |r| < 1.'),

('math_town','intermediate','Mathematics',
 'If A and B are mutually exclusive, P(A∪B) = ?',
 '["P(A)×P(B)","P(A)+P(B)-P(A∩B)","P(A)+P(B)","P(A|B)"]',2,
 'Mutually exclusive means P(A∩B) = 0, so P(A∪B) = P(A) + P(B).'),

('math_town','intermediate','Mathematics',
 'The roots of x² - 5x + 6 = 0 are:',
 '["2 and 4","1 and 6","2 and 3","3 and 4"]',2,
 'Factors: (x-2)(x-3) = 0 → x = 2 or x = 3.'),

('math_town','intermediate','Mathematics',
 'What is the value of lim(x→0) [sin(x)/x]?',
 '["0","∞","1","undefined"]',2,
 'This is a standard limit: lim(x→0) sin(x)/x = 1.'),

('math_town','intermediate','Mathematics',
 'What is the rank of the matrix [[1,2,3],[2,4,6],[3,6,9]]?',
 '["0","1","2","3"]',1,
 'Rows 2 and 3 are multiples of row 1 — only 1 linearly independent row. Rank = 1.'),

('math_town','intermediate','Mathematics',
 'The angle between vectors A=(1,0) and B=(0,1) is:',
 '["0°","45°","90°","180°"]',2,
 'cos θ = A·B / (|A||B|) = 0. So θ = 90°.'),

('math_town','intermediate','Mathematics',
 'What is the maximum value of f(x) = -x² + 4x - 1?',
 '["1","3","4","5"]',1,
 'f''(x) = -2x + 4 = 0 → x=2. f(2) = -4 + 8 - 1 = 3.')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SEED: CHEM TOWN — BASIC (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('chem_town','basic','Chemistry',
 'What is the atomic number of Carbon?',
 '["4","6","8","12"]',1,
 'Carbon (C) has 6 protons → atomic number = 6.'),

('chem_town','basic','Chemistry',
 'Which gas is produced when a metal reacts with dilute acid?',
 '["Oxygen","Carbon dioxide","Hydrogen","Nitrogen"]',2,
 'Metal + Dilute acid → Salt + Hydrogen gas. E.g. Zn + H₂SO₄ → ZnSO₄ + H₂↑'),

('chem_town','basic','Chemistry',
 'What is the chemical formula of water?',
 '["HO","H₂O","H₂O₂","OH"]',1,
 'Water is H₂O — two hydrogen atoms bonded to one oxygen.'),

('chem_town','basic','Chemistry',
 'Which element has the symbol "Na"?',
 '["Nitrogen","Neon","Sodium","Nickel"]',2,
 'Na comes from Latin "Natrium" — the chemical symbol for Sodium.'),

('chem_town','basic','Chemistry',
 'The pH of a neutral solution at 25°C is:',
 '["0","7","14","1"]',1,
 'pH 7 = neutral. Below 7 = acidic. Above 7 = basic.'),

('chem_town','basic','Chemistry',
 'Which type of bond forms when electrons are shared between atoms?',
 '["Ionic","Covalent","Metallic","Hydrogen"]',1,
 'Covalent bonds are formed by sharing of electron pairs between atoms.'),

('chem_town','basic','Chemistry',
 'What is the valency of Oxygen?',
 '["1","2","3","4"]',1,
 'Oxygen has 6 valence electrons and needs 2 more to complete its octet. Valency = 2.'),

('chem_town','basic','Chemistry',
 'Which of the following is a noble gas?',
 '["Hydrogen","Nitrogen","Argon","Chlorine"]',2,
 'Argon (Ar) belongs to Group 18 — the noble gases. It has a full outer electron shell.'),

('chem_town','basic','Chemistry',
 'What is the chemical name of NaCl?',
 '["Sodium carbonate","Sodium chloride","Sodium hydroxide","Sodium oxide"]',1,
 'NaCl = Sodium chloride (common table salt).'),

('chem_town','basic','Chemistry',
 'Avogadro''s number is approximately:',
 '["6.022 × 10²³","3.14 × 10²³","9.8 × 10²³","1.6 × 10¹⁹"]',0,
 'Avogadro''s number = 6.022 × 10²³ mol⁻¹. It represents the number of entities in one mole.')

ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- SEED: CHEM TOWN — INTERMEDIATE (10 questions)
-- ─────────────────────────────────────────────────────────
INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('chem_town','intermediate','Chemistry',
 'According to VSEPR theory, the shape of a water molecule (H₂O) is:',
 '["Linear","Trigonal planar","Bent / V-shaped","Tetrahedral"]',2,
 'H₂O has 2 bonding pairs + 2 lone pairs on O → bent/V-shaped geometry.'),

('chem_town','intermediate','Chemistry',
 'For the reaction N₂ + 3H₂ → 2NH₃, what is the equilibrium expression Kc?',
 '["[NH₃]²/([N₂][H₂]³)","[N₂][H₂]³/[NH₃]²","[NH₃]/([N₂][H₂])","[NH₃]²/[H₂]³"]',0,
 'Kc = [products]^coeff / [reactants]^coeff = [NH₃]² / ([N₂][H₂]³).'),

('chem_town','intermediate','Chemistry',
 'Which quantum number defines the shape of an orbital?',
 '["Principal (n)","Azimuthal (l)","Magnetic (ml)","Spin (ms)"]',1,
 'The azimuthal quantum number l defines the shape: l=0(s), l=1(p), l=2(d), l=3(f).'),

('chem_town','intermediate','Chemistry',
 'The hybridization of carbon in ethene (C₂H₄) is:',
 '["sp","sp²","sp³","sp³d"]',1,
 'Each carbon in ethene forms 3 σ bonds + 1 π bond → sp² hybridization.'),

('chem_town','intermediate','Chemistry',
 'Entropy (S) of a system always increases in a:',
 '["Reversible process","Irreversible process","Isothermal process","Adiabatic process"]',1,
 'The 2nd Law of Thermodynamics: entropy increases in irreversible (spontaneous) processes.'),

('chem_town','intermediate','Chemistry',
 'Which of the following is an example of a nucleophile?',
 '["H⁺","BF₃","AlCl₃","OH⁻"]',3,
 'A nucleophile donates electrons. OH⁻ is electron-rich → nucleophile. H⁺, BF₃, AlCl₃ are electrophiles.'),

('chem_town','intermediate','Chemistry',
 'The rate law for a reaction that is first order in [A] and second order in [B] is:',
 '["rate = k[A][B]","rate = k[A]²[B]","rate = k[A][B]²","rate = k[A]²[B]²"]',2,
 'Rate = k[A]¹[B]² — exponents equal the respective orders.'),

('chem_town','intermediate','Chemistry',
 'In a galvanic cell, oxidation occurs at the:',
 '["Cathode","Anode","Salt bridge","Electrolyte"]',1,
 'OIL RIG: Oxidation Is Loss → at the Anode. Reduction → at the Cathode.'),

('chem_town','intermediate','Chemistry',
 'The van''t Hoff factor (i) for NaCl completely dissociated in water is:',
 '["1","2","3","0.5"]',1,
 'NaCl → Na⁺ + Cl⁻ → 2 particles per formula unit → i = 2.'),

('chem_town','intermediate','Chemistry',
 'Which law states that at constant temperature, pressure and volume of a gas are inversely proportional?',
 '["Charles''s Law","Avogadro''s Law","Boyle''s Law","Dalton''s Law"]',2,
 'Boyle''s Law: P ∝ 1/V at constant T. PV = constant.')

ON CONFLICT DO NOTHING;
```

---

## 7. Server: Express API Specification

### 7.1 `/server/index.js` — Entry Point

```javascript
// Responsibilities (implement in this order):
// 1. require('dotenv').config()
// 2. const db = require('./db/pool')
// 3. Create express app
// 4. Middleware: cors({ origin: process.env.CLIENT_ORIGIN, credentials: true })
//               express.json()
//               morgan('dev')   [only if NODE_ENV !== 'production']
// 5. Mount routes:
//      app.use('/api/auth',     require('./routes/auth.routes'))
//      app.use('/api',          require('./routes/encounter.routes'))
//      app.use('/api',          require('./routes/battle.routes'))
//      app.use('/api',          require('./routes/player.routes'))
// 6. Global error handler (see Section 13)
// 7. db.init().then(() => app.listen(PORT, ...)).catch(console.error)
```

### 7.2 `/server/db/pool.js`

```javascript
// Exports:
//   pool  — a new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
//   query(text, params) — async wrapper: return (await pool.query(text, params)).rows
//   init() — async: reads schema.sql with fs.readFileSync, executes it via pool.query
//             Log "Database initialized" on success.
```

### 7.3 `/server/middleware/auth.middleware.js`

```javascript
// Purpose: Protect routes that require a logged-in player.
// Usage:   router.get('/protected-route', authMiddleware, controller)

// Logic:
// 1. Read Authorization header: "Bearer <token>"
// 2. If missing → res.status(401).json({ error: 'No token provided' })
// 3. jwt.verify(token, process.env.JWT_SECRET)
//    - On error → res.status(401).json({ error: 'Invalid or expired token' })
//    - On success → attach decoded payload to req.player and call next()

// NOTE: In v1.0, /api/encounters and /api/battle/evaluate do NOT use this middleware
// (player_id is trusted from request body). Future versions should protect these too.
// /api/player/:id and /api/player/sync SHOULD use this middleware.
```

### 7.4 `/server/middleware/validate.js`

```javascript
// Uses express-validator. Export the following validator arrays:

// validateRegister — rules for POST /auth/register:
//   body('username').trim().isLength({ min: 3, max: 50 }).isAlphanumeric()
//   body('password').isLength({ min: 8 })

// validateLogin — rules for POST /auth/login:
//   body('username').trim().notEmpty()
//   body('password').notEmpty()

// validateEvaluate — rules for POST /battle/evaluate:
//   body('player_id').isUUID()
//   body('question_id').isInt({ min: 1 })
//   body('selected_idx').isInt({ min: 0, max: 3 })
//   body('is_gym_battle').isBoolean()

// In every route that uses these, add after the validator array:
//   const errors = validationResult(req)
//   if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })
```

---

### 7.5 API Routes — Full Specification

#### `POST /api/auth/register`

**Request Body:**
```json
{ "username": "YashRPG", "password": "SecurePass123" }
```

**Controller Logic:**
1. Run `validateRegister` middleware
2. Check `SELECT id FROM players WHERE username = $1` → 409 if found
3. `bcrypt.hash(password, 12)`
4. `INSERT INTO players (username, password) VALUES ($1, $2) RETURNING id, username, level, exp, hp, max_hp`
5. Sign JWT: `{ player_id: player.id, username }` with `JWT_SECRET`, `JWT_EXPIRES_IN`
6. Return `{ token, player }` — **never include the password hash in the response**

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": { "id": "uuid", "username": "YashRPG", "level": 1, "exp": 0, "hp": 100, "max_hp": 100 }
}
```

**Errors:** `400` validation fail · `409` username taken · `500` DB error

---

#### `POST /api/auth/login`

**Request Body:**
```json
{ "username": "YashRPG", "password": "SecurePass123" }
```

**Controller Logic:**
1. Run `validateLogin` middleware
2. `SELECT * FROM players WHERE username = $1` → 404 if not found
3. `bcrypt.compare(password, player.password)` → 401 if mismatch
4. Sign JWT same as register
5. Return `{ token, player }` (same shape, status 200)

---

#### `GET /api/encounters`

**Query Params:** `?zone=physics_town&difficulty=basic`

**Valid zones:** `physics_town`, `math_town`, `chem_town`
**Valid difficulties:** `basic`, `intermediate`

**Controller Logic:**
1. Validate query params against allowed values → 400 if invalid
2. `SELECT id, question_text, options, subject FROM questions WHERE zone = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 1`
3. If no rows → 404 `{ error: 'No questions found for this zone and difficulty' }`
4. **CRITICAL: Never return `correct_idx` or `explanation` — this is anti-cheat.**

**Response (200):**
```json
{ "id": 3, "subject": "Mathematics", "question_text": "What is the derivative of sin(x)?", "options": ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"] }
```

---

#### `POST /api/battle/evaluate`

**Request Body:**
```json
{ "player_id": "uuid", "question_id": 3, "selected_idx": 0, "is_gym_battle": false }
```

**Controller Logic — implement step by step, in order:**
```
1. Run validateEvaluate middleware
2. Fetch: SELECT correct_idx, explanation, zone FROM questions WHERE id = $1
   → 404 if not found
3. is_correct = (selected_idx === correct_idx)
4. Fetch: SELECT level, exp FROM players WHERE id = $1  → 404 if not found
5. Build response = { correct: is_correct, exp_gained: 0, new_level: player.level,
                      new_exp: player.exp, badge_earned: null, explanation: null }

6. IF is_correct:
   a. exp_gained = is_gym_battle ? 100 : 10
   b. new_exp = player.exp + exp_gained
   c. Recalculate level using LEVEL_THRESHOLDS (from constants or inline):
        new_level = player.level
        thresholds = { 1:100, 2:300, 3:600, 4:1000, 5:1500, 6:2100, 7:2800, 8:3600, 9:4500 }
        while (new_level < 10 && new_exp >= thresholds[new_level]) { new_level++ }
   d. UPDATE players SET exp = new_exp, level = new_level WHERE id = player_id
   e. If is_gym_battle:
        badge_name = question.zone + '_Badge'   (e.g. 'physics_town_Badge')
        INSERT INTO player_badges (player_id, badge_name, zone)
          VALUES ($1, $2, $3) ON CONFLICT (player_id, badge_name) DO NOTHING
        Set response.badge_earned = badge_name
   f. Set response.explanation = question.explanation
   g. Update response: exp_gained, new_level, new_exp

7. Return response (200)
```

**Response (200 — correct answer):**
```json
{ "correct": true, "exp_gained": 10, "new_level": 1, "new_exp": 10, "badge_earned": null, "explanation": "d/dx[sin(x)] = cos(x)" }
```

**Response (200 — wrong answer):**
```json
{ "correct": false, "exp_gained": 0, "new_level": 1, "new_exp": 0, "badge_earned": null, "explanation": null }
```

> **Codex Instruction:** Wrong answers return HTTP 200 (not 400). The `correct: false` field is how the client knows. HP deduction happens client-side only.

---

#### `GET /api/player/:id`

```sql
SELECT id, username, level, exp, hp, max_hp, map_x, map_y FROM players WHERE id = $1
```

**Response (200):**
```json
{ "id": "uuid", "username": "YashRPG", "level": 2, "exp": 150, "hp": 80, "max_hp": 100, "map_x": 512, "map_y": 320 }
```

**Use `authMiddleware` on this route.**

---

#### `POST /api/player/sync`

**Request Body:**
```json
{ "player_id": "uuid", "map_x": 512, "map_y": 320 }
```

**Controller Logic:**
```sql
UPDATE players SET map_x = $1, map_y = $2 WHERE id = $3
```

**Response (200):** `{ "synced": true }`

---

#### `GET /api/badges/:player_id`

```sql
SELECT badge_name, zone, earned_at FROM player_badges WHERE player_id = $1 ORDER BY earned_at ASC
```

**Response (200):**
```json
{ "badges": [{ "badge_name": "physics_town_Badge", "zone": "physics_town", "earned_at": "2025-01-01T12:00:00Z" }] }
```

---

### 7.6 Global Error Handler

```javascript
// Must be the LAST middleware registered in index.js
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})
```

---

## 8. Client: Next.js Application

### 8.1 `/client/next.config.js`

> **Codex Instruction:** Phaser uses browser globals (`window`, `document`). Without this config, Next.js will crash during SSR. This file is critical — do not omit it.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['phaser'],
  webpack: (config) => {
    // Phaser imports browser-only modules — exclude from server bundle
    config.externals = config.externals || []
    return config
  },
}

module.exports = nextConfig
```

### 8.2 `/client/src/app/layout.js`

```javascript
// Import the Press Start 2P font from Google Fonts
// Use next/font/google:
//   import { Press_Start_2P } from 'next/font/google'
//   const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] })
// Apply className to <html> or <body> so the font is globally available
// Also import global CSS (Tailwind base, etc.)
```

### 8.3 Page Routing

| Path | File | Behavior |
|------|------|----------|
| `/` | `app/page.js` | Check localStorage for `academia_token`. If present → redirect to `/dashboard`. If absent → redirect to `/login`. Use `useRouter` from `next/navigation`. |
| `/login` | `app/login/page.js` | Render `<LoginForm />`. If already logged in → redirect to `/dashboard`. |
| `/register` | `app/register/page.js` | Render `<RegisterForm />`. If already logged in → redirect to `/dashboard`. |
| `/dashboard` | `app/dashboard/page.js` | Protected page. If no token → redirect to `/login`. Wrap with `PlayerProvider`. Render `<Dashboard />`. |

### 8.4 `/client/src/lib/api.js`

> **Codex Instruction:** All HTTP calls from React code must go through this file. No inline `fetch()` in components.

```javascript
// Read base URL from env
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL

// Internal helper — used by all exported functions
async function callApi(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Exported API functions:
export const registerPlayer = (username, password) =>
  callApi('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })

export const loginPlayer = (username, password) =>
  callApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const getPlayer = (player_id) =>
  callApi(`/player/${player_id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('academia_token')}`,
    },
  })

export const syncPosition = (player_id, map_x, map_y) =>
  callApi('/player/sync', { method: 'POST', body: JSON.stringify({ player_id, map_x, map_y }) })

export const getBadges = (player_id) =>
  callApi(`/badges/${player_id}`)
```

### 8.5 `/client/src/context/PlayerContext.jsx`

```javascript
// State shape:
// {
//   playerId: null,     // UUID string
//   username: '',
//   level: 1,
//   exp: 0,
//   hp: 100,
//   maxHp: 100,
//   token: null,
//   isLoaded: false,    // true once rehydration from localStorage completes
// }

// Context must expose:
//   setPlayerData(data)             — bulk update after login/register response
//   updateHp(newHp)                 — called by GameWrapper on 'academia:hpUpdate' event
//   updateExpAndLevel(exp, level)   — called by GameWrapper on 'academia:expUpdate' event
//   logout()                        — clear state + localStorage.removeItem('academia_token')

// On initial mount (useEffect, []):
//   1. const token = localStorage.getItem('academia_token')
//   2. If token exists:
//        a. Decode: const payload = JSON.parse(atob(token.split('.')[1]))
//        b. Call getPlayer(payload.player_id) — catches and redirects on error
//        c. setPlayerData({ ...playerFromAPI, token })
//   3. Set isLoaded = true regardless
```

### 8.6 `/client/src/hooks/usePlayer.js`

```javascript
// Simple hook — wraps useContext(PlayerContext)
// Throw a descriptive error if used outside PlayerProvider
import { useContext } from 'react'
import { PlayerContext } from '../context/PlayerContext'

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside a PlayerProvider')
  return ctx
}
```

### 8.7 `/client/src/components/LoginForm.jsx`

```
Controlled form with two inputs: username, password.
On submit:
  1. setLoading(true), setError('')
  2. Await loginPlayer(username, password)
  3. On success:
       localStorage.setItem('academia_token', data.token)
       setPlayerData(data.player)   [via usePlayer()]
       router.push('/dashboard')
  4. On error: setError(err.message)
  5. setLoading(false)

UI requirements:
  - "Play Academia" heading (Press Start 2P font)
  - Username input (type="text", minLength=3)
  - Password input (type="password", minLength=8)
  - Submit button: "Login" — disabled and shows "Loading..." when loading
  - Error message in red if setError has a value
  - Link to /register: "No account? Register"
  - Dark RPG-themed background (Tailwind: bg-gray-900, text-green-400)
```

### 8.8 `/client/src/components/RegisterForm.jsx`

```
Same pattern as LoginForm, but:
  - Calls registerPlayer(username, password)
  - Additional confirm-password field (client-side validation only — must match password)
  - Shows success message briefly before redirect
  - Link to /login: "Already have an account? Login"
```

### 8.9 `/client/src/components/Dashboard.jsx`

```
Reads from usePlayer() context.
Shows:
  - "Welcome, {username}!" heading
  - Level badge: "LVL {level}"
  - EXP bar: filled proportion = exp / LEVEL_THRESHOLDS[level], shown as a progress bar
             Text below: "{exp} / {LEVEL_THRESHOLDS[level]} EXP"
             At level 10 show "MAX LEVEL"
  - HP display: "{hp} / {maxHp} HP"
  - Badges section: list of badges from getBadges(playerId).
       Each badge shows zone name and earned date.
       If no badges: "No badges yet — challenge a Gym!"
  - A large "▶ PLAY" button that sets a local state showGame=true,
       which conditionally renders <GameWrapper /> below the dashboard UI.
  - "Logout" button that calls logout() from usePlayer() and redirects to /login.
```

### 8.10 `/client/src/components/HUD.jsx`

```
Positioned absolutely over the Phaser canvas (z-index: 10).
Reads from usePlayer() context.

Layout (top-left corner overlay):
  ┌────────────────────────────────┐
  │  ❤ HP  [████████░░] 80/100   │
  │  ⭐ EXP [████░░░░░░] 80/100  │
  │  LVL 2   |  Physics Town      │
  └────────────────────────────────┘

Props: zone (string — current zone label from WorldScene)

HP bar: red fill, width% = (hp / maxHp) * 100
EXP bar: yellow/gold fill, width% = (exp / threshold) * 100
Use Press Start 2P font for all text.
Container: dark semi-transparent background (rgba(0,0,0,0.7)), border: 2px solid #4488cc.
```

### 8.11 `/client/src/components/GameWrapper.jsx`

> **Codex Instruction:** This is the most critical React component. Read every line carefully.

```javascript
// Must use 'use client' directive at top (Next.js App Router)
'use client'

// Key constraints:
// 1. Phaser MUST be dynamically imported — it cannot run on server (uses window/document)
// 2. The Phaser game instance must be created only once — use useRef to store it
// 3. Cleanup on unmount is mandatory — call game.destroy(true)

// On mount (useEffect, []):
//   Step 1: Dynamic import
//     const Phaser = (await import('phaser')).default
//     const { default: config } = await import('../game/config')
//     const { BootScene } = await import('../game/BootScene')
//     const { WorldScene } = await import('../game/WorldScene')
//     const { BattleScene } = await import('../game/BattleScene')
//
//   Step 2: Inject player state into config before creating game
//     config.scene = [BootScene, WorldScene, BattleScene]
//     config.gameData = {
//       playerId: player.playerId,
//       level:    player.level,
//       exp:      player.exp,
//       hp:       player.hp,
//       map_x:    400,     // default — overridden by DB value after getPlayer()
//       map_y:    300,
//       zone:     'physics_town',
//     }
//
//   Step 3: Create the game
//     gameRef.current = new Phaser.Game(config)
//
//   Step 4: Listen for state bridge events from Phaser
//     const onExpUpdate = (e) => updateExpAndLevel(e.detail.exp, e.detail.level)
//     const onHpUpdate  = (e) => updateHp(e.detail.hp)
//     const onSyncPos   = (e) => syncPosition(player.playerId, e.detail.map_x, e.detail.map_y)
//     window.addEventListener('academia:expUpdate',    onExpUpdate)
//     window.addEventListener('academia:hpUpdate',     onHpUpdate)
//     window.addEventListener('academia:syncPosition', onSyncPos)
//
//   Cleanup on unmount:
//     window.removeEventListener('academia:expUpdate',    onExpUpdate)
//     window.removeEventListener('academia:hpUpdate',     onHpUpdate)
//     window.removeEventListener('academia:syncPosition', onSyncPos)
//     if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null }
//     syncPosition(player.playerId, ...) — call one final time with last known coords

// Render:
//   <div className="relative">
//     <div id="phaser-container" style={{ width: 800, height: 600 }} />
//     <HUD zone={currentZone} />   {/* overlay */}
//   </div>
//
// currentZone state: initialized to 'Physics Town'.
// Update it by listening to a custom 'academia:zoneChange' event from WorldScene.
```

---

## 9. Phaser 3 Game Engine — Scene Architecture

> **Codex Instruction:** All files in `/client/src/game/` are plain ES module JavaScript files. They must NOT import React. They must NOT import from `next/*`. They communicate with React ONLY via `window.dispatchEvent(new CustomEvent('academia:*', { detail: {} }))`. Access server URL via `process.env.NEXT_PUBLIC_API_BASE_URL` (Next.js inlines this at build time).

---

### 9.1 `/client/src/game/config.js`

```javascript
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants'

// Note: scene array is injected by GameWrapper before new Phaser.Game(config)
// Export as default
const config = {
  type: Phaser.AUTO,              // Use WebGL if available, fallback to Canvas
  width: CANVAS_WIDTH,            // 800
  height: CANVAS_HEIGHT,          // 600
  parent: 'phaser-container',     // Must match the div id in GameWrapper.jsx
  pixelArt: true,                 // Disables anti-aliasing — required for 16×16 tiles
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },          // Top-down game — no gravity
      debug: false,               // Set true during development to see hitboxes
    },
  },
  scene: [],      // Populated by GameWrapper: [BootScene, WorldScene, BattleScene]
  gameData: {},   // Populated by GameWrapper with player state before game init
}

export default config
```

---

### 9.2 `/client/src/game/BootScene.js`

```javascript
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    // ── Loading bar (drawn with Phaser Graphics) ──────────────
    const { width, height } = this.scale
    const barW = 320, barH = 20
    const barX = (width - barW) / 2
    const barY = height / 2

    const bgBar    = this.add.graphics()
    const fillBar  = this.add.graphics()
    const loadText = this.add.text(width/2, barY - 30, 'Loading...', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5)

    bgBar.fillStyle(0x222222).fillRect(barX, barY, barW, barH)
    bgBar.lineStyle(2, 0x4488cc).strokeRect(barX, barY, barW, barH)

    this.load.on('progress', (value) => {
      fillBar.clear()
      fillBar.fillStyle(0x22bb55).fillRect(barX + 2, barY + 2, (barW - 4) * value, barH - 4)
    })

    this.load.on('complete', () => { loadText.setText('Ready!') })

    // ── Asset Loads ───────────────────────────────────────────
    this.load.tilemapTiledJSON('world', '/assets/tilemaps/world.json')
    this.load.image('tileset', '/assets/tilesets/tileset.png')
    this.load.spritesheet('player', '/assets/sprites/player.png', {
      frameWidth: 16, frameHeight: 16
    })
    this.load.image('battle_bg', '/assets/ui/battle_bg.png')
  }

  create() {
    this.scene.start('WorldScene')
  }
}
```

---

### 9.3 `/client/src/game/WorldScene.js`

```javascript
import { PLAYER_SPEED, GRASS_ENCOUNTER_CHANCE, BATTLE_COOLDOWN_MS, GYM_LEVEL_REQUIREMENT, ZONE_LABELS } from './constants'

export class WorldScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldScene' }) }

  init(data) {
    // Receives { fromBattle: true/false } when returning from BattleScene
    this.returnData = data || {}
    this.gymTransitioning = false
    this.grassCooldown    = false
  }

  create() {
    const gameData = this.game.config.gameData

    // ── TILEMAP ────────────────────────────────────────────────
    const map = this.make.tilemap({ key: 'world' })
    const tileset = map.addTilesetImage('tileset', 'tileset')  // 2nd arg must match tileset name in Tiled

    this.groundLayer    = map.createLayer('Ground',    tileset, 0, 0)
    this.obstacleLayer  = map.createLayer('Obstacles', tileset, 0, 0)
    this.tallGrassLayer = map.createLayer('TallGrass', tileset, 0, 0)

    this.obstacleLayer.setCollisionByProperty({ collides: true })

    // ── PLAYER ─────────────────────────────────────────────────
    const startX = gameData.map_x || 400
    const startY = gameData.map_y || 300

    this.player = this.physics.add.sprite(startX, startY, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(1)

    // ── ANIMATIONS (create only if not already created) ────────
    const animDefs = [
      { key: 'walk-down',  frames: [0,1,2]  },
      { key: 'walk-left',  frames: [3,4,5]  },
      { key: 'walk-right', frames: [6,7,8]  },
      { key: 'walk-up',    frames: [9,10,11]},
      { key: 'idle',       frames: [0]      },
    ]
    animDefs.forEach(({ key, frames }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map(f => ({ key: 'player', frame: f })),
          frameRate: key === 'idle' ? 1 : 8,
          repeat: -1,
        })
      }
    })

    // ── PHYSICS COLLIDER ───────────────────────────────────────
    this.physics.add.collider(this.player, this.obstacleLayer)

    // ── WORLD BOUNDS & CAMERA ──────────────────────────────────
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)  // 0.1 lerp = smooth follow

    // ── INPUT ──────────────────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys()
    // WASD support
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })

    // ── GYM ZONE TRIGGER ───────────────────────────────────────
    // Coordinates: adjust based on world.json gym NPC placement
    this.gymZone = this.add.zone(700, 200, 48, 48)
    this.physics.world.enable(this.gymZone, Phaser.Physics.Arcade.STATIC_BODY)

    this.currentZone = gameData.zone || 'physics_town'

    this.physics.add.overlap(this.player, this.gymZone, this._onGymOverlap, null, this)

    // ── POST-BATTLE COOLDOWN ───────────────────────────────────
    if (this.returnData.fromBattle) {
      this.grassCooldown = true
      this.time.delayedCall(BATTLE_COOLDOWN_MS, () => { this.grassCooldown = false })
    }

    // ── ZONE CHANGE EVENT → React ──────────────────────────────
    window.dispatchEvent(new CustomEvent('academia:zoneChange', {
      detail: { zone: ZONE_LABELS[this.currentZone] || this.currentZone }
    }))
  }

  update() {
    this.player.setVelocity(0)

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown

    let moving   = false
    let animKey  = 'idle'

    if (left)       { this.player.setVelocityX(-PLAYER_SPEED); animKey = 'walk-left';  moving = true }
    else if (right) { this.player.setVelocityX( PLAYER_SPEED); animKey = 'walk-right'; moving = true }

    if (up)         { this.player.setVelocityY(-PLAYER_SPEED); animKey = 'walk-up';    moving = true }
    else if (down)  { this.player.setVelocityY( PLAYER_SPEED); animKey = 'walk-down';  moving = true }

    // Normalize diagonal movement to avoid faster speed diagonally
    if (moving) {
      this.player.body.velocity.normalize().scale(PLAYER_SPEED)
    }

    this.player.anims.play(animKey, true)

    // ── POSITION SYNC → React ──────────────────────────────────
    // Dispatch every 5 seconds while playing
    // (Handled by GameWrapper on unmount for the final sync)

    // ── GRASS RNG ENCOUNTER ────────────────────────────────────
    if (moving && !this.grassCooldown) {
      const tile = this.tallGrassLayer.getTileAtWorldXY(this.player.x, this.player.y)
      if (tile && Math.random() < GRASS_ENCOUNTER_CHANCE) {
        this.grassCooldown = true   // Lock immediately — prevents double-fire
        this.scene.start('BattleScene', {
          zone:          this.currentZone,
          difficulty:    'basic',
          is_gym_battle: false,
        })
      }
    }
  }

  // ── PRIVATE METHODS ──────────────────────────────────────────

  _onGymOverlap() {
    const level = this.game.config.gameData.level || 1
    const required = GYM_LEVEL_REQUIREMENT[this.currentZone] || 3

    if (level < required) {
      this.showFloatingText(
        this.player.x,
        this.player.y - 30,
        `Need Level ${required}!`,
        '#ff4444'
      )
    } else if (!this.gymTransitioning) {
      this.gymTransitioning = true
      this.scene.start('BattleScene', {
        zone:          this.currentZone,
        difficulty:    'intermediate',
        is_gym_battle: true,
      })
    }
  }

  showFloatingText(x, y, message, color = '#ffffff') {
    // Convert world coords to camera coords for display
    const text = this.add.text(x, y, message, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: color,
    }).setOrigin(0.5).setDepth(10)

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power1',
      onComplete: () => text.destroy(),
    })
  }
}
```

---

### 9.4 `/client/src/game/BattleScene.js`

```javascript
import { HP_DAMAGE, EXP_BASIC, EXP_GYM } from './constants'

export class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'BattleScene' }) }

  init(data) {
    this.zone         = data.zone          || 'physics_town'
    this.difficulty   = data.difficulty    || 'basic'
    this.isGymBattle  = data.is_gym_battle || false
    this.questionData = null
    this.answered     = false
    this.selectedBtnIdx = 0    // For keyboard navigation: 0–3
    this.buttons      = []     // Array of { bg, text } for keyboard nav
  }

  create() {
    const { width, height } = this.scale

    // ── BACKGROUND ─────────────────────────────────────────────
    this.add.image(width/2, height/2, 'battle_bg').setDisplaySize(width, height)
    this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55)

    // ── TITLE ──────────────────────────────────────────────────
    const title = this.isGymBattle ? '⚡ GYM BATTLE ⚡' : '🌿 Wild Encounter!'
    this.add.text(width/2, 40, title, {
      fontFamily: '"Press Start 2P"', fontSize: '16px',
      color: this.isGymBattle ? '#ffd700' : '#90ee90',
    }).setOrigin(0.5)

    // ── LOADING TEXT ───────────────────────────────────────────
    this.loadingText = this.add.text(width/2, height/2, 'Loading question...', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffffff',
    }).setOrigin(0.5)

    // ── KEYBOARD NAVIGATION HINT ───────────────────────────────
    this.add.text(width/2, height - 20, '← → ↑ ↓ to navigate · ENTER to confirm', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#888888',
    }).setOrigin(0.5)

    // ── FETCH QUESTION ─────────────────────────────────────────
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    fetch(`${apiBase}/encounters?zone=${this.zone}&difficulty=${this.difficulty}`)
      .then(r => r.json())
      .then(data => {
        this.questionData = data
        this.loadingText.destroy()
        this.renderQuestion(data)
      })
      .catch(() => {
        this.loadingText.setText('Connection error.\nSPACE to return.')
        this.input.keyboard.once('keydown-SPACE', () => this.returnToWorld())
      })
  }

  renderQuestion(data) {
    const { width } = this.scale

    // ── SUBJECT BADGE ──────────────────────────────────────────
    this.add.text(width/2, 80, `[ ${data.subject} ]`, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#aaaaff',
    }).setOrigin(0.5)

    // ── QUESTION TEXT ──────────────────────────────────────────
    this.add.text(width/2, 185, data.question_text, {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#ffffff',
      wordWrap: { width: 700, useAdvancedWrap: true }, align: 'center',
    }).setOrigin(0.5)

    // ── OPTION BUTTONS (2×2 grid) ──────────────────────────────
    const positions = [
      { x: 200, y: 360 },   // A — top left
      { x: 600, y: 360 },   // B — top right
      { x: 200, y: 450 },   // C — bottom left
      { x: 600, y: 450 },   // D — bottom right
    ]
    const labels = ['A', 'B', 'C', 'D']
    this.buttons = []

    data.options.forEach((optionText, idx) => {
      const pos = positions[idx]

      const bg = this.add.rectangle(pos.x, pos.y, 340, 60, 0x1a3a5c)
        .setInteractive({ cursor: 'pointer' })
        .setStrokeStyle(2, 0x4488cc)

      this.add.text(pos.x - 145, pos.y, labels[idx], {
        fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ffd700',
      }).setOrigin(0.5)

      const optText = this.add.text(pos.x + 15, pos.y, optionText, {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff',
        wordWrap: { width: 280 }, align: 'center',
      }).setOrigin(0.5)

      bg.on('pointerover', () => { if (!this.answered) bg.setFillStyle(0x2a5a8c) })
      bg.on('pointerout',  () => { if (!this.answered) bg.setFillStyle(idx === this.selectedBtnIdx ? 0x2a5a8c : 0x1a3a5c) })
      bg.on('pointerdown', () => { if (!this.answered) { this.answered = true; this.submitAnswer(idx, bg) } })

      this.buttons.push({ bg, optText, idx })
    })

    // ── KEYBOARD NAVIGATION ────────────────────────────────────
    // Selection grid:  [0, 1]
    //                  [2, 3]
    this.highlightButton(this.selectedBtnIdx)

    this.input.keyboard.on('keydown-LEFT',  () => this.navigateButtons(-1, 'h'))
    this.input.keyboard.on('keydown-RIGHT', () => this.navigateButtons( 1, 'h'))
    this.input.keyboard.on('keydown-UP',    () => this.navigateButtons(-2, 'v'))
    this.input.keyboard.on('keydown-DOWN',  () => this.navigateButtons( 2, 'v'))
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.answered) {
        this.answered = true
        this.submitAnswer(this.selectedBtnIdx, this.buttons[this.selectedBtnIdx].bg)
      }
    })
  }

  navigateButtons(delta, axis) {
    if (this.answered) return
    const newIdx = Math.max(0, Math.min(3, this.selectedBtnIdx + delta))
    this.buttons[this.selectedBtnIdx].bg.setFillStyle(0x1a3a5c)
    this.selectedBtnIdx = newIdx
    this.highlightButton(newIdx)
  }

  highlightButton(idx) {
    if (this.buttons[idx]) {
      this.buttons[idx].bg.setFillStyle(0x2a5a8c).setStrokeStyle(3, 0x88ccff)
    }
  }

  submitAnswer(selectedIdx, buttonRef) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    const { playerId } = this.game.config.gameData

    fetch(`${apiBase}/battle/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id:     playerId,
        question_id:   this.questionData.id,
        selected_idx:  selectedIdx,
        is_gym_battle: this.isGymBattle,
      }),
    })
      .then(r => r.json())
      .then(result => {
        if (result.correct) this.onCorrectAnswer(result, buttonRef)
        else                this.onWrongAnswer(result, buttonRef)
      })
      .catch(() => {
        // Network error — don't penalize player, just return
        this.returnToWorld()
      })
  }

  onCorrectAnswer(result, buttonRef) {
    const { width } = this.scale

    // 1. Highlight button green
    buttonRef.setFillStyle(0x22bb55).setStrokeStyle(3, 0x55ff88)

    // 2. EXP feedback
    this.add.text(width/2, 270, `✓ CORRECT! +${result.exp_gained} EXP`, {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#55ff88',
    }).setOrigin(0.5)

    // 3. Explanation (if any)
    if (result.explanation) {
      this.add.text(width/2, 300, result.explanation, {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aaaaaa',
        wordWrap: { width: 640 }, align: 'center',
      }).setOrigin(0.5)
    }

    // 4. Level-up effect
    const prevLevel = this.game.config.gameData.level || 1
    if (result.new_level > prevLevel) this.showLevelUpEffect(result.new_level)

    // 5. Badge effect
    if (result.badge_earned) this.showBadgeEffect(result.badge_earned)

    // 6. Update local gameData
    this.game.config.gameData.exp   = result.new_exp
    this.game.config.gameData.level = result.new_level

    // 7. Dispatch to React HUD
    window.dispatchEvent(new CustomEvent('academia:expUpdate', {
      detail: { exp: result.new_exp, level: result.new_level }
    }))

    // 8. Return after delay
    this.time.delayedCall(2500, () => this.returnToWorld(true))
  }

  onWrongAnswer(result, buttonRef) {
    const { width } = this.scale

    // 1. Highlight button red
    buttonRef.setFillStyle(0xbb2222).setStrokeStyle(3, 0xff5555)

    // 2. Screen shake
    this.cameras.main.shake(500, 0.02)

    // 3. Damage text
    this.add.text(width/2, 270, `✗ WRONG! -${HP_DAMAGE} HP`, {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ff5555',
    }).setOrigin(0.5)

    // 4. Deduct HP locally (HP is session-only — not stored in DB)
    const currentHp = this.game.config.gameData.hp ?? 100
    const newHp     = Math.max(0, currentHp - HP_DAMAGE)
    this.game.config.gameData.hp = newHp

    // 5. Dispatch HP update to React HUD
    window.dispatchEvent(new CustomEvent('academia:hpUpdate', { detail: { hp: newHp } }))

    // 6. Game over or return
    this.time.delayedCall(2500, () => {
      if (newHp <= 0) this.showGameOver()
      else            this.returnToWorld(true)
    })
  }

  showLevelUpEffect(newLevel) {
    const { width, height } = this.scale
    const text = this.add.text(width/2, height/2 - 60, `LEVEL UP!\n▶ Lv.${newLevel}`, {
      fontFamily: '"Press Start 2P"', fontSize: '20px', color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: text, alpha: 1, scaleX: 1.1, scaleY: 1.1,
      yoyo: true, duration: 600, repeat: 1,
    })
  }

  showBadgeEffect(badgeName) {
    const { width } = this.scale
    const panel = this.add.rectangle(width/2, 530, 500, 40, 0xffd700, 0.9)
    this.add.text(width/2, 530, `🏅 Badge Earned: ${badgeName}`, {
      fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#000000',
    }).setOrigin(0.5)
  }

  showGameOver() {
    const { width, height } = this.scale
    this.cameras.main.fade(600, 0, 0, 0)

    this.time.delayedCall(600, () => {
      this.cameras.main.resetFX()
      this.add.rectangle(width/2, height/2, width, height, 0x000000)
      this.add.text(width/2, height/2 - 20, 'GAME OVER', {
        fontFamily: '"Press Start 2P"', fontSize: '28px', color: '#ff4444',
      }).setOrigin(0.5)
      this.add.text(width/2, height/2 + 30, 'Returning to world...', {
        fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#aaaaaa',
      }).setOrigin(0.5)

      // Reset HP
      this.game.config.gameData.hp = 100
      window.dispatchEvent(new CustomEvent('academia:hpUpdate', { detail: { hp: 100 } }))

      this.time.delayedCall(3000, () => this.returnToWorld(true))
    })
  }

  returnToWorld(fromBattle = false) {
    // Dispatch final position sync
    window.dispatchEvent(new CustomEvent('academia:syncPosition', {
      detail: {
        map_x: this.game.config.gameData.map_x || 400,
        map_y: this.game.config.gameData.map_y || 300,
      }
    }))
    this.scene.start('WorldScene', { fromBattle })
  }
}
```

---

## 10. Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. User submits LoginForm                                   │
│  2. loginPlayer(username, password) → POST /api/auth/login   │
│  3. Server returns { token, player }                         │
│  4. Client: localStorage.setItem('academia_token', token)    │
│  5. setPlayerData(player) updates PlayerContext              │
│  6. router.push('/dashboard')                                │
│                                                              │
│  On every page load (/dashboard):                            │
│  7. PlayerContext reads localStorage['academia_token']       │
│  8. Decodes payload — no library needed:                     │
│       JSON.parse(atob(token.split('.')[1]))                   │
│  9. Calls getPlayer(payload.player_id) to get fresh state    │
│  10. If token missing → redirect to /login                   │
│  11. If getPlayer() throws (expired/invalid) → logout()      │
│       → redirect to /login                                   │
└──────────────────────────────────────────────────────────────┘

JWT Payload shape:
{
  "player_id": "uuid",
  "username": "YashRPG",
  "iat": 1700000000,
  "exp": 1700604800
}
```

---

## 11. Game State Management

### 11.1 State Ownership Table

| State | Owner | Persisted To |
|-------|-------|-------------|
| `level`, `exp` | DB (authoritative) | `players` table |
| `hp` | Local (session only) | Resets to 100 on login |
| `map_x`, `map_y` | DB (synced on game exit) | `players` table |
| `badges` | DB | `player_badges` table |
| `JWT token` | `localStorage` | Browser |
| Active Phaser scene | `SceneManager` | RAM only |
| `gameData` | `Phaser.Game.config.gameData` | RAM — synced to DB via events |

### 11.2 React ↔ Phaser Communication Bridge

```
Direction       Event Name                  Payload Shape
─────────────────────────────────────────────────────────────────
Phaser → React  'academia:expUpdate'        { exp: Number, level: Number }
Phaser → React  'academia:hpUpdate'         { hp: Number }
Phaser → React  'academia:syncPosition'     { map_x: Number, map_y: Number }
Phaser → React  'academia:zoneChange'       { zone: String }   ← zone display name

React → Phaser  (direct) gameRef.current.config.gameData.*
                (read)    Phaser reads gameData in scene init/update
```

### 11.3 Level Threshold Formula

```
threshold(n) = n × (n + 1) / 2 × 100

Level 1→2 :   100 EXP total
Level 2→3 :   300 EXP total
Level 3→4 :   600 EXP total
Level 4→5 :  1000 EXP total
Level 5→6 :  1500 EXP total
Level 6→7 :  2100 EXP total
Level 7→8 :  2800 EXP total
Level 8→9 :  3600 EXP total
Level 9→10:  4500 EXP total
Level 10  :  MAX (Infinity — no further leveling)
```

---

## 12. Asset Manifest

> **Codex Instruction:** Do NOT generate binary assets. List them here so Yash knows what to provide. Show placeholder import code that will work once assets are placed at these paths.

| Asset | Path | Format | Required Specs |
|-------|------|--------|---------------|
| World Tilemap | `/public/assets/tilemaps/world.json` | Tiled JSON | Layers: `Ground`, `Obstacles`, `TallGrass`. Tile size: 16×16. Map: 50×50 tiles min. Obstacle tiles need custom property `collides: true`. Tileset name in Tiled must be `"tileset"`. |
| Tileset PNG | `/public/assets/tilesets/tileset.png` | PNG | 16×16 px per tile. Standard RPG Maker / LPC-style. |
| Player Spritesheet | `/public/assets/sprites/player.png` | PNG | 12 frames, each 16×16. Row 0 (frames 0–2): walk-down. Row 1 (frames 3–5): walk-left. Row 2 (frames 6–8): walk-right. Row 3 (frames 9–11): walk-up. |
| Battle Background | `/public/assets/ui/battle_bg.png` | PNG | 800×600. Dark RPG arena aesthetic. |

**Free asset sources:** OpenGameArt.org · LPC Character Generator (liberatedpixelcup.org) · itch.io free assets

---

## 13. Error Handling Contract

### Server-Side (all controllers)

```javascript
// Every controller must follow this exact pattern:
async function controllerName(req, res, next) {
  try {
    // ... business logic
    res.status(200).json(result)
  } catch (err) {
    next(err)   // Always delegate to global error handler
  }
}

// HTTP status codes used:
// 200 → Success (including "wrong answer" — see /battle/evaluate note)
// 201 → Created (register)
// 400 → Bad request / validation failure
// 401 → Unauthorized (wrong password / invalid token)
// 404 → Resource not found
// 409 → Conflict (duplicate username or badge)
// 500 → Unhandled server error
```

### Client-Side (`api.js`)

```javascript
// Every API call must throw on non-ok response.
// Components catch this and set an error state string for UI display.
// Never show raw stack traces to the user.
```

### Phaser-Side

```javascript
// Every fetch() in BattleScene MUST have a .catch() block.
// On network error: show message, wait 2s, call returnToWorld().
// NEVER let an unhandled promise rejection crash the game loop.
// NEVER call scene.start() from inside a promise without checking if scene is still active.
```

---

## 14. Known Gotchas & Codex Warnings

> **Codex Instruction:** Read this section before implementing anything. These are real problems that will break the project silently if ignored.

### 14.1 Phaser & Next.js SSR Conflict
- **Problem:** Phaser accesses `window` at import time. Next.js runs code on the server where `window` does not exist. An `import Phaser from 'phaser'` at the top of any file will crash the server build.
- **Solution:** Always use dynamic import inside a `useEffect` in `GameWrapper.jsx`:
  ```javascript
  useEffect(() => {
    (async () => {
      const Phaser = (await import('phaser')).default
      // ... rest of game init
    })()
  }, [])
  ```
- **Also required:** `transpilePackages: ['phaser']` in `next.config.js`.

### 14.2 Phaser Animation Re-registration
- **Problem:** If `WorldScene` is restarted (player returns from battle), `this.anims.create()` will throw because the animation key already exists.
- **Solution:** Always guard with `if (!this.anims.exists(key))` before calling `this.anims.create()`. This is already included in the WorldScene spec above.

### 14.3 React Double-Mount (Strict Mode)
- **Problem:** In development, React 18 Strict Mode mounts components twice. This will create two Phaser game instances and potentially two sets of event listeners.
- **Solution:** In `GameWrapper.jsx`, guard the game init with `if (gameRef.current) return` at the start of the `useEffect` callback. Also ensure cleanup in the return function destroys the game properly.

### 14.4 Phaser Canvas Parent Element
- **Problem:** Phaser's `parent: 'phaser-container'` must find a DOM element with that exact id **before** `new Phaser.Game(config)` is called. If the element hasn't rendered yet, Phaser will fall back to document.body.
- **Solution:** The dynamic import and game creation must happen inside `useEffect` (which only runs after the DOM renders). This is already the correct pattern. Do not call `new Phaser.Game()` outside of `useEffect`.

### 14.5 Environment Variables in Phaser Scenes
- **Problem:** Phaser scenes run client-side. Next.js only inlines `NEXT_PUBLIC_*` variables at build time.
- **Solution:** Use `process.env.NEXT_PUBLIC_API_BASE_URL` inside Phaser files — Next.js will substitute the value at build time even in non-React files that are part of the Next.js bundle.

### 14.6 Supabase SSL Connection
- **Problem:** Supabase requires SSL. Without `ssl: { rejectUnauthorized: false }` in the pg Pool config, connections will fail in production.
- **Solution:** Already specified in `pool.js` spec. Do not omit this.

### 14.7 Grass Encounter Double-Firing
- **Problem:** `Math.random() < 0.02` runs every frame (~60 fps). Without a cooldown, a battle can start on the very first frame of returning from a previous battle, creating a loop.
- **Solution:** The `grassCooldown` flag + `BATTLE_COOLDOWN_MS` delay is already specified. Ensure `this.grassCooldown = true` is set **before** calling `this.scene.start()`.

---

## 15. Setup & Run Instructions

### Prerequisites
- Node.js v18+
- npm v9+
- Supabase account (free tier)
- Tiled Map Editor 1.10+ (to create/edit world.json)

### First-Time Setup

```bash
# 1. Create monorepo
mkdir academia-rpg && cd academia-rpg

# 2. Setup server
mkdir server && cd server
npm init -y
npm install express pg bcryptjs jsonwebtoken cors dotenv morgan express-validator
cd ..

# 3. Setup client
mkdir client && cd client
npx create-next-app@14 . --app --tailwind --no-typescript --src-dir --import-alias "@/*"
npm install phaser
cd ..

# 4. Create .env files (fill in your values)
# /server/.env — see Section 3.1
# /client/.env.local — see Section 3.2

# 5. Initialize database
# Open Supabase dashboard → SQL editor → paste /server/db/schema.sql → Run

# 6. Start development
# Terminal 1:
cd server && node index.js

# Terminal 2:
cd client && npm run dev
```

### npm Scripts

| Command | Location | Effect |
|---------|----------|--------|
| `node index.js` | `/server` | Start Express on port 5000 |
| `npm run dev` | `/client` | Next.js dev server on port 3000 |
| `npm run build` | `/client` | Production build |
| `npm start` | `/client` | Serve production build |

---

## 16. Deployment Guide

### Client → Vercel

```bash
# 1. Push /client to a GitHub repo
# 2. Connect to vercel.com → Import Project
# 3. Set Environment Variable in Vercel dashboard:
#      NEXT_PUBLIC_API_BASE_URL = https://your-express-server.onrender.com/api
# 4. Deploy
```

### Server → Render (free tier)

```
1. Push /server to GitHub
2. Create a new "Web Service" on render.com
3. Build Command: npm install
4. Start Command: node index.js
5. Add Environment Variables (copy from .env):
     DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_ORIGIN, NODE_ENV=production
6. CLIENT_ORIGIN = https://your-app.vercel.app
```

> **Note:** Update the CORS `CLIENT_ORIGIN` on the server and `NEXT_PUBLIC_API_BASE_URL` on the client to point to each other's production URLs before deploying.

---

## 17. Codex Implementation Checklist

> **Codex Instruction:** Execute items strictly in order. Do not begin a phase until all items in the previous phase have been verified. Mark each item complete before moving on.

### Phase 1 — Server Foundation
- [ ] Create `/server/package.json` with all dependencies
- [ ] Create `/server/db/pool.js` — pg Pool + `query()` + `init()` reading schema.sql
- [ ] Create `/server/db/schema.sql` — all CREATE TABLE statements + full seed data (Section 5 + 6)
- [ ] Create `/server/index.js` — CORS, middleware, route mounting, error handler, `db.init()` then listen
- [ ] Create `/server/middleware/validate.js` — all validator arrays
- [ ] Create `/server/middleware/auth.middleware.js` — JWT verification
- [ ] Implement `auth.controller.js` + `auth.routes.js` (register + login)
- [ ] Implement `encounter.controller.js` + `encounter.routes.js`
- [ ] Implement `battle.controller.js` + `battle.routes.js` (with level-up logic)
- [ ] Implement `player.controller.js` + `player.routes.js` (getPlayer, sync, badges)
- [ ] **TEST ALL ENDPOINTS with Postman/Insomnia before touching client**:
  - [ ] Register → returns token + player
  - [ ] Login → returns token + player
  - [ ] GET /encounters?zone=physics_town&difficulty=basic → returns MCQ without correct_idx
  - [ ] POST /battle/evaluate (correct answer) → correct: true, exp updated in DB
  - [ ] POST /battle/evaluate (wrong answer) → correct: false, DB unchanged
  - [ ] POST /battle/evaluate (gym battle, correct) → badge_earned set, badge in player_badges
  - [ ] GET /player/:id → returns fresh player data
  - [ ] POST /player/sync → returns { synced: true }
  - [ ] GET /badges/:player_id → returns badge array

### Phase 2 — Next.js Shell
- [ ] Create `/client/next.config.js` with Phaser transpile config (Section 8.1)
- [ ] Create `/client/.env.local`
- [ ] Create `/client/src/app/layout.js` with Press Start 2P font
- [ ] Create `/client/src/lib/api.js` with all fetch wrappers
- [ ] Create `/client/src/context/PlayerContext.jsx` — full state + actions + rehydration
- [ ] Create `/client/src/hooks/usePlayer.js`
- [ ] Create `/client/src/app/page.js` — redirect logic
- [ ] Create `/client/src/app/login/page.js` + `LoginForm.jsx`
- [ ] Create `/client/src/app/register/page.js` + `RegisterForm.jsx`
- [ ] Create `/client/src/app/dashboard/page.js` — protected route
- [ ] Create `Dashboard.jsx` — level, EXP bar, badges, Play button, Logout
- [ ] Create `HUD.jsx` — HP bar, EXP bar, level display, zone label
- [ ] **TEST**: Register → Login → See dashboard → Logout → Redirects to login

### Phase 3 — Phaser Game
- [ ] Create `/client/src/game/constants.js` (Section 4.1)
- [ ] Create `/client/src/game/config.js`
- [ ] Create `/client/src/game/BootScene.js` — asset preloader with loading bar
- [ ] Create `/client/src/game/WorldScene.js` — full implementation (Section 9.3)
- [ ] Create `/client/src/game/BattleScene.js` — full implementation (Section 9.4)
- [ ] Create `GameWrapper.jsx` — dynamic Phaser import + event bridge + cleanup

### Phase 4 — Integration & Full Loop Test
- [ ] Wire `academia:expUpdate` → `updateExpAndLevel()` → HUD EXP bar re-renders
- [ ] Wire `academia:hpUpdate` → `updateHp()` → HUD HP bar re-renders
- [ ] Wire `academia:zoneChange` → `currentZone` state in `GameWrapper` → HUD zone label updates
- [ ] Wire `academia:syncPosition` → `syncPosition()` API call
- [ ] Confirm game cleanup on Dashboard unmount fires `syncPosition` + `game.destroy(true)`
- [ ] **Full loop test**:
  - [ ] Register new account
  - [ ] Login → Dashboard shows Lv.1, 0 EXP, 100 HP
  - [ ] Click Play → Phaser canvas loads
  - [ ] Walk player into tall grass → BattleScene launches
  - [ ] Answer MCQ correctly → EXP update in HUD + EXP updated in DB
  - [ ] Answer MCQ wrongly → HP drops in HUD (DB unchanged for HP)
  - [ ] Lose all HP → GameOver screen → return to world with HP reset to 100
  - [ ] Reach Level 3 → Walk to Gym → BattleScene launches with `is_gym_battle: true`
  - [ ] Win gym battle → badge_earned in response → badge appears in Dashboard
  - [ ] Refresh page → Dashboard still shows correct level/EXP/badges (persisted in DB)

---

*End of ARCHITECTURE.md — Academia 2D RPG*
*Author: Yash Sawalakhe · BCA 3rd Year Project · Version 3.0 (Codex-Prime)*
