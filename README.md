# Mako Poker

A GTO (Game Theory Optimal) poker training application with a Bun/TypeScript backend, React frontend, and Python CFR solver.

## Architecture

This project uses a **hybrid ONNX architecture** where:
- **Training** is done in Python (leveraging PyTorch for neural networks)
- **Inference** is done in TypeScript (using ONNX Runtime for production)
- **Game logic** lives in TypeScript (single source of truth)

```
mako-poker/
├── apps/
│   ├── web/                    # React frontend (Vite + Tailwind)
│   └── api/                    # Elysia backend (Bun)
├── packages/
│   ├── shared/                 # Shared types and utilities
│   └── inference/              # ONNX model inference (TypeScript)
├── solver/                     # Python CFR solver (training only)
├── docker-compose.yml          # PostgreSQL database
├── package.json                # Bun workspace root
└── tsconfig.json               # Base TypeScript config
```

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://docker.com/) (for PostgreSQL)
- [Python](https://python.org/) >= 3.11 (for solver)

## Quick Start

### 1. Install Bun (if not already installed)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Database

```bash
# Start PostgreSQL in Docker
bun run db:start

# Push schema to database
cd apps/api && bun run db:push
```

### 4. Configure Environment

Create `apps/api/.env`:

```bash
DATABASE_URL=postgresql://mako:mako@localhost:5432/mako
JWT_SECRET=your-secret-key-change-in-production
```

### 5. Start Development Servers

```bash
# Start all services (frontend + API)
bun run dev

# Or start individually:
bun run dev:web   # Frontend only (http://localhost:5173)
bun run dev:api   # API only (http://localhost:8080)
```

## Development

### Running Tests

```bash
# Run all tests
bun run test

# Run frontend tests
cd apps/web && bun test

# Run API tests
cd apps/api && bun test

# Watch mode
bun test --watch
```

### Type Checking

```bash
bun run typecheck
```

### Database Commands

```bash
# Start PostgreSQL
bun run db:start

# Stop PostgreSQL
bun run db:stop

# View database logs
bun run db:logs

# Push schema changes
cd apps/api && bun run db:push

# Generate migrations
cd apps/api && bun run db:generate

# Open Drizzle Studio (GUI)
cd apps/api && bun run db:studio
```

## Project Structure

### apps/web (Frontend)

React application with:
- Vite for development and builds
- Tailwind CSS for styling
- Zustand for state management
- React Query for API calls

### apps/api (Backend)

Elysia server with:
- JWT authentication
- PostgreSQL with Drizzle ORM
- RESTful API

### packages/shared

Shared TypeScript types and utilities:
- Game state types (`GameState`, `Player`, `Card`)
- Card utilities (`rankValue()`, `suitSymbol()`, `formatCardDisplay()`)
- Action constants (`ACTION_FOLD`, `ACTION_CALL`, etc.)

### solver (Training Only)

Python CFR solver for offline training:
- Deep CFR implementation with PyTorch
- ONNX export for TypeScript inference
- No runtime dependency in production

**Training a model:**

```bash
cd solver
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Train and export
python -c "
from src.cfr.deep_cfr import DeepCFR
solver = DeepCFR()
solver.train(iterations=10000)
solver.export_to_onnx('models/')
"
```

### packages/inference

TypeScript ONNX inference:
- Loads trained models exported from Python
- Uses ONNX Runtime for fast inference
- Provides GTO strategy recommendations

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT
- `GET /auth/me` - Get current user

### Game

- `POST /game/start` - Start new game
- `GET /game/current` - Get current game
- `POST /game/:id/deal` - Deal new hand
- `POST /game/:id/action` - Submit player action
- `POST /game/:id/ai-action` - Process AI action

### Health

- `GET /health` - Health check

## Environment Variables

### Required (apps/api/.env)

```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
```

### Optional

```bash
PORT=8080                           # API server port
CORS_ORIGIN=http://localhost:5173   # Allowed CORS origin
NODE_ENV=development                # Environment mode
```

## Production Deployment

### Environment Setup

```bash
# Production environment variables
DATABASE_URL=postgresql://user:password@production-host:5432/mako
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

### Build

```bash
# Build frontend
cd apps/web && bun run build

# Frontend output: apps/web/dist
# Serve with nginx or similar
```

### Run API

```bash
cd apps/api && bun run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test`
5. Submit a pull request

## License

MIT
