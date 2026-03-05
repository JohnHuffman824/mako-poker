# Mako Poker

A GTO (Game Theory Optimal) poker assistant platform. Currently being rebuilt from a game engine into an intelligent poker training assistant powered by Claude and CFR-based solving.

> The original game engine codebase is preserved on the `snapshot/mako-poker-v1` branch.

## Tech Stack

### Backend
- **Bun** runtime with **Elysia** web framework
- **PostgreSQL** with **Drizzle ORM**
- **JWT** authentication

### Solver (In Development)
- **Python 3.12** for CFR implementation
- **PyTorch** for neural network training
- **ONNX** for cross-platform model deployment

### Shared Package
- TypeScript types and constants shared across packages

## Project Structure

```
mako-poker/
├── apps/
│   └── api/                           # Backend API Server
│       └── src/
│           ├── domain/                # Core poker primitives
│           │   ├── hand-evaluator.ts  # 5-7 card hand ranking
│           │   └── hand-rankings.ts   # Hand ranking data
│           ├── services/
│           │   ├── auth-service.ts    # JWT authentication
│           │   └── position-service.ts # Position naming/ordering
│           ├── routes/                # REST API endpoints
│           ├── db/                    # Database schema and client
│           └── test/                  # Unit tests
│
├── packages/
│   └── shared/                        # Shared TypeScript utilities
│       └── src/
│           ├── types/                 # Card, Player, Hand, Auth types
│           └── constants/             # Position names, hand eval, ranks
│
├── solver/                            # Python CFR Solver
│   └── src/
│       ├── game/                      # Poker primitives
│       ├── abstraction/               # Hand bucketing, action abstraction
│       ├── cfr/                       # CFR+ and Deep CFR algorithms
│       └── training/                  # Model training orchestration
│
└── docs/                              # Planning and design docs
```

## Quick Start

```bash
# Install dependencies
bun install

# Start database
bun run db:start

# Initialize database schema
cd apps/api && bun run db:push && cd ../..

# Configure environment
echo 'DATABASE_URL=postgresql://mako:mako@localhost:5432/mako' > apps/api/.env
echo 'JWT_SECRET=dev-secret-change-in-production' >> apps/api/.env

# Start API server
bun run dev
```

The API will be available at http://localhost:8080.

## Development Commands

```bash
# Development
bun run dev                # Start DB + API
bun run dev:api            # API only

# Database
bun run db:start           # Start PostgreSQL container
bun run db:stop            # Stop PostgreSQL container
cd apps/api && bun run db:push      # Push schema changes
cd apps/api && bun run db:studio    # Open Drizzle Studio GUI

# Testing
bun test                   # Run all tests
bun test --watch           # Watch mode

# Type Checking
bun run typecheck          # Run TypeScript compiler checks
```

## API Endpoints

```
POST   /auth/register    - Create new user account
POST   /auth/login       - Login and receive JWT token
GET    /auth/me          - Get current user profile
GET    /health           - Service health status
```

## Solver

The Python-based CFR solver is available for offline GTO training. It is not required to run the main application.

```bash
cd solver
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m unittest discover -s tests -p "test_*.py"
```

## License

MIT

## Contact

**Jack Huffman**
[GitHub](https://github.com/JohnHuffman824) | [LinkedIn](https://www.linkedin.com/in/john-huffman-33a10b211/) | [Email](jackhuffan424@gmail.com)
