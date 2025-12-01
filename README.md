# Poker GTO Assistant

A Game Theory Optimal poker advisor with a modern tech stack.

## Architecture

```
poker-gto/
├── backend/          # Kotlin + Spring Boot API
│   ├── src/main/kotlin/com/pokergto/
│   │   ├── controller/  # REST endpoints
│   │   ├── service/     # Business logic
│   │   ├── repository/  # Data access
│   │   ├── model/       # Domain entities
│   │   ├── dto/         # Data transfer objects
│   │   └── security/    # JWT authentication
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/ # Flyway migrations
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── api/         # API client
│       ├── components/  # React components
│       └── App.tsx      # Main app
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: React 18, Vite 4, TypeScript, Tailwind CSS
- **Backend**: Kotlin, Spring Boot 3.2, Spring Security, Spring Data JPA
- **Database**: PostgreSQL 16
- **Auth**: JWT tokens (access + refresh)

## Quick Start

### 1. Start PostgreSQL

```bash
# Using Homebrew (Mac)
brew services start postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
createdb pokergto  # First time only
```

### 2. Start Backend (Terminal 1)

```bash
cd backend
./gradlew bootRun
```

Backend starts at: http://localhost:8080/api
API Docs: http://localhost:8080/api/swagger-ui.html

### 3. Start Frontend (Terminal 2)

```bash
cd frontend
npm install  # First time only
npm run dev
```

Frontend starts at: http://localhost:3000

## API Endpoints

### Health
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT tokens
- `POST /api/auth/refresh` - Refresh token

### Sessions
- `GET /api/sessions` - List sessions
- `GET /api/sessions/current` - Get active session
- `POST /api/sessions` - Create session

### Analysis
- `POST /api/analyze/quick` - Quick GTO analysis

## Database

### View in Postico 2
- Host: `localhost`
- Port: `5432`
- User: `jackhuffman`
- Database: `pokergto`
- Password: (empty)

### Command Line
```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
psql -d pokergto
\dt   # List tables
\q    # Quit
```

## Development

### Backend
```bash
cd backend
./gradlew bootRun                    # Start server
./gradlew test                       # Run tests
./gradlew build                      # Build JAR
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
```

## License

MIT

