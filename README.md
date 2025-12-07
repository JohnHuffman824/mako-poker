# Mako Poker

A full-stack Game Theory Optimal (GTO) poker training application featuring real-time gameplay, AI opponents, and a sophisticated betting engine. Built with modern web technologies and designed for scalability.

## 🎯 Overview

Mako Poker is a professional-grade poker training platform that allows players to practice against AI opponents while learning optimal poker strategy. The application features a complete poker game engine with comprehensive betting logic, hand evaluation, position management, and multi-player support.

## ✨ Key Features

- **Real-time Poker Gameplay** - Full Texas Hold'em implementation with support for 2-10 players
- **Sophisticated Betting Engine** - Comprehensive bet validation, pot management, side pots, and all-in scenarios
- **AI Opponents** - Automated decision-making with configurable difficulty and play styles
- **Responsive UI** - Modern React interface with dynamic table positioning and smooth animations
- **User Authentication** - JWT-based auth with secure session management
- **Game State Persistence** - PostgreSQL database with Drizzle ORM for reliable data storage
- **Comprehensive Test Coverage** - 500+ unit tests ensuring betting rules, hand evaluation, and game flow correctness

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Bun's native bundler** for development and production builds
- **Tailwind CSS** for responsive, utility-first styling
- **Zustand** for lightweight state management
- **React Query** for server state and caching
- **shadcn/ui** component library

### Backend
- **Bun** runtime for high-performance JavaScript/TypeScript
- **Elysia** web framework with type-safe routing
- **PostgreSQL** database with connection pooling
- **Drizzle ORM** for type-safe database queries
- **JWT** authentication and authorization

### AI/ML (In Development)
- **Python 3.12** for solver implementation
- **PyTorch** for neural network training
- **Counterfactual Regret Minimization (CFR)** algorithm
- **ONNX** for cross-platform model deployment

### DevOps
- **Docker Compose** for local database
- **Bun workspaces** for monorepo management
- **TypeScript** strict mode across entire codebase

## 🏗 Architecture

This project demonstrates a **hybrid training/inference architecture** designed for optimal performance:

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION STACK                       │
│  ┌─────────────┐      ┌──────────────┐      ┌───────────┐  │
│  │   React     │ ───▶ │  Elysia API  │ ───▶ │PostgreSQL │  │
│  │  Frontend   │ ◀─── │  (Bun/TS)    │ ◀─── │ Database  │  │
│  └─────────────┘      └──────────────┘      └───────────┘  │
│         │                     │                             │
│         │                     ▼                             │
│         │           ┌─────────────────┐                     │
│         └──────────▶│  ONNX Runtime   │                     │
│                     │  (AI Inference) │                     │
│                     └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    (Model Export - Offline)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING PIPELINE (WIP)                  │
│  ┌──────────────┐      ┌─────────────┐      ┌───────────┐  │
│  │   PyTorch    │ ───▶ │  Deep CFR   │ ───▶ │   ONNX    │  │
│  │Neural Network│ ◀─── │   Solver    │ ◀─── │  Export   │  │
│  └──────────────┘      └─────────────┘      └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

**Why Bun?** 
- 3x faster than Node.js for API responses
- Built-in TypeScript support without transpilation
- Native test runner and bundler
- Excellent developer experience

**Why Hybrid Python/TypeScript?**
- Python excels at ML training (PyTorch ecosystem)
- TypeScript excels at production inference (type safety, performance)
- ONNX bridges the gap, allowing offline training without runtime Python dependency

**Why Monorepo?**
- Shared types between frontend/backend prevent API mismatches
- Single source of truth for game logic
- Simplified dependency management and deployment

## 📁 Project Structure

```
mako-poker/
├── apps/
│   ├── web/                           # React Frontend Application
│   │   ├── src/
│   │   │   ├── features/game/         # Game UI components and logic
│   │   │   │   ├── components/        # Poker table, cards, betting controls
│   │   │   │   ├── hooks/             # useGame, useGameActions, useAuth
│   │   │   │   └── store/             # Zustand game state management
│   │   │   └── components/ui/         # shadcn/ui component library
│   │   └── test/                      # Frontend unit tests
│   │
│   └── api/                           # Backend API Server
│       ├── src/
│       │   ├── routes/                # REST API endpoints
│       │   ├── services/              # Business logic layer
│       │   │   ├── game-service.ts    # Game state management
│       │   │   ├── betting-service.ts # Betting rules and validation
│       │   │   ├── ai-service.ts      # AI decision making
│       │   │   └── auth-service.ts    # JWT authentication
│       │   ├── domain/                # Core game primitives
│       │   │   ├── game-state.ts      # Immutable game state
│       │   │   ├── hand-evaluator.ts  # 5-7 card hand ranking
│       │   │   └── game-events.ts     # Event sourcing
│       │   └── db/                    # Database schema and client
│       └── test/                      # 500+ API unit tests
│
├── packages/
│   ├── shared/                        # Shared TypeScript utilities
│   │   └── types/                     # Common types (Card, Player, Action)
│   └── inference/                     # ONNX model inference (planned)
│
├── solver/                            # Python CFR Solver (WIP)
│   ├── src/
│   │   ├── game/                      # Poker primitives (Card, Deck, Action)
│   │   ├── abstraction/               # Hand bucketing, action abstraction
│   │   ├── cfr/                       # CFR+ and Deep CFR algorithms
│   │   └── training/                  # Model training orchestration
│   └── tests/                         # Python unit tests
│
└── docker-compose.yml                 # PostgreSQL database
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://docker.com/) (for PostgreSQL)
- Node.js 18+ (fallback if Bun unavailable)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mako-poker.git
cd mako-poker

# 2. Install dependencies
bun install

# 3. Start database
bun run db:start

# 4. Initialize database schema
cd apps/api && bun run db:push && cd ../..

# 5. Configure environment
echo 'DATABASE_URL=postgresql://mako:mako@localhost:5432/mako' > apps/api/.env
echo 'JWT_SECRET=dev-secret-change-in-production' >> apps/api/.env

# 6. Start development servers
bun run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8080

## 🧪 Running Tests

```bash
# Run all tests (frontend + backend)
bun run test

# Run with coverage
bun run test --coverage

# Run specific test suites
cd apps/api && bun test                    # Backend tests only
cd apps/web && bun test                    # Frontend tests only

# Watch mode for TDD
bun test --watch
```

The test suite includes:
- **Betting Rules**: 518 test cases covering all scenarios (raises, all-ins, side pots)
- **Hand Evaluation**: Comprehensive tests for all poker hand rankings
- **Game Flow**: Integration tests for complete hand lifecycles
- **Position Management**: Tests for dealer button, blind posting, and action order
- **AI Behavior**: Tests for decision-making logic

## 📊 API Endpoints

### Authentication
```
POST   /auth/register    - Create new user account
POST   /auth/login       - Login and receive JWT token
GET    /auth/me          - Get current user profile
```

### Game Management
```
POST   /game/start       - Initialize new game session
GET    /game/current     - Retrieve active game state
POST   /game/:id/deal    - Deal new hand
POST   /game/:id/action  - Submit player action (fold/call/raise)
POST   /game/:id/ai-action - Process AI opponent decision
```

### Health Check
```
GET    /health           - Service health status
```

## 🔧 Development Commands

```bash
# Development
bun run dev                # Start all services
bun run dev:web            # Frontend only
bun run dev:api            # Backend only

# Database
bun run db:start           # Start PostgreSQL container
bun run db:stop            # Stop PostgreSQL container
bun run db:studio          # Open Drizzle Studio GUI
cd apps/api && bun run db:push      # Push schema changes
cd apps/api && bun run db:generate  # Generate migrations

# Type Checking
bun run typecheck          # Run TypeScript compiler checks

# Testing
bun run test               # Run all tests
bun run test:watch         # Run tests in watch mode
```

## 🤖 AI Solver (Work In Progress)

The Python-based CFR (Counterfactual Regret Minimization) solver is currently under development. This component trains neural networks to play optimal poker strategy using game theory.

**Status**: Core game logic and test infrastructure complete. CFR algorithm implementation in progress.

**Requirements**: Python 3.12 (due to onnxruntime dependencies)

```bash
# Setup (when complete)
cd solver
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run tests
python -m unittest discover -s tests -p "test_*.py"
```

The solver is **not required** to run the main application. It's only used for offline training of AI models.

## 🎨 Technical Highlights

### Betting Engine
- Supports no-limit betting with min-raise enforcement
- Handles complex all-in scenarios with proper side pot calculation
- Validates all actions against game rules (stack sizes, bet sizing, action order)
- Tracks pot contributions per player for accurate showdown payouts

### Hand Evaluation
- Efficient 5-7 card hand ranking algorithm
- Supports all hand types from high card to royal flush
- Kicker comparison for tie-breaking
- Optimized for performance (evaluates hands in <1ms)

### Game State Management
- Immutable state pattern for predictable updates
- Event sourcing for complete hand history
- Type-safe state transitions
- Comprehensive logging for debugging

### Position System
- Dynamic seat positioning based on player count (2-9 players)
- Automatic dealer button rotation
- Correct blind posting for all table sizes
- Heads-up (2-player) special rules handling

## 🏗 Production Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://user:password@host:5432/mako
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Build and Deploy
```bash
# Build frontend
cd apps/web && bun run build
# Output: apps/web/dist (serve with nginx/cloudflare/vercel)

# Run API server
cd apps/api && bun run start
```

### Database Migrations
```bash
cd apps/api
bun run db:generate    # Generate migration files
bun run db:migrate     # Apply migrations to production
```

## 📈 Future Enhancements

- [ ] Complete Deep CFR solver implementation
- [ ] ONNX model inference in production
- [ ] Tournament mode with multiple tables
- [ ] Hand history replay and analysis
- [ ] Player statistics and tracking
- [ ] Real-time multiplayer with WebSockets
- [ ] Mobile-responsive design improvements
- [ ] Range visualization tools

## 📝 License

MIT

## 🤝 Contact

**Jack Huffman**  
[GitHub](https://github.com/JohnHuffman824) • [LinkedIn](https://www.linkedin.com/in/john-huffman-33a10b211/) • [Email](jackhuffan424@gmail.com)
