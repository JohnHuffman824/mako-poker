# Mako Poker Backend

Kotlin/Spring Boot backend for the Mako Poker application.

## Technology Stack

- **Language**: Kotlin 2.0
- **Framework**: Spring Boot 3.2
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: OpenAPI/Swagger

## Prerequisites

- JDK 17+
- Docker & Docker Compose (for local development)
- PostgreSQL 16 (if running without Docker)
- Redis 7 (if running without Docker)

## Quick Start

### 1. Setup Database

**Option A: Using Homebrew (Easiest for local dev)**

```bash
# Run the setup script
./backend/scripts/setup-db.sh

# Or manually:
brew install postgresql@16
brew services start postgresql@16
createdb makopoker
```

**Option B: Using Docker**

```bash
# Make sure Docker Desktop is running first!
docker run --name makopoker-postgres \
  -e POSTGRES_DB=makopoker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16-alpine

docker run --name makopoker-redis \
  -p 6379:6379 -d redis:7-alpine
```

### 2. Run the Application

```bash
cd backend

# Using Gradle wrapper
./gradlew bootRun

# Or with specific profile
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3. Access the API

- **API Base URL**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/api/api-docs

## Project Structure

```
src/main/kotlin/com/pokergto/
├── PokerGtoApplication.kt    # Main application entry
├── config/                    # Spring configuration
│   ├── SecurityConfig.kt     # JWT & CORS configuration
│   ├── OpenApiConfig.kt      # Swagger/OpenAPI config
│   └── GlobalExceptionHandler.kt
├── controller/               # REST API controllers
│   ├── AuthController.kt     # Authentication endpoints
│   ├── GameController.kt     # Game management
│   └── HealthController.kt   # Health checks
├── dto/                      # Data Transfer Objects
├── model/                    # JPA Entities
│   ├── User.kt
│   ├── Game.kt
│   └── Player.kt
├── repository/               # Spring Data JPA repositories
├── security/                 # JWT authentication
│   ├── JwtTokenProvider.kt
│   ├── JwtAuthenticationFilter.kt
│   ├── UserPrincipal.kt
│   └── CustomUserDetailsService.kt
└── service/                  # Business logic
    ├── AuthService.kt
    ├── GameService.kt
    └── PlayerService.kt
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token

### Game Management
- `GET /api/games/current` - Get current game state
- `POST /api/games` - Start new game
- `POST /api/games/{id}/deal` - Deal new hand
- `POST /api/games/{id}/actions` - Submit player action
- `POST /api/games/{id}/ai-action` - Process AI action
- `PATCH /api/games/{id}/player-count` - Update player count

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness check

## Viewing the Database

**⚠️ Note: PostgreSQL requires a PostgreSQL client**

**Recommended PostgreSQL Clients:**
- **Postico 2** - https://eggerapps.at/postico2/ (Mac, free for basic use)
- **TablePlus** - https://tableplus.com/ (Multi-platform)
- **Command Line** - Run `./backend/scripts/view-db.sh`

**Connection Details:**

If using **Homebrew PostgreSQL:**
- **Host:** `localhost`
- **Port:** `5432`
- **User:** Your macOS username (check with `whoami`)
- **Password:** (leave empty)
- **Database:** `makopoker`

If using **Docker PostgreSQL:**
- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `makopoker`

**To view the schema directly:**
Open `backend/src/main/resources/db/migration/V1__initial_schema.sql`

## Configuration

Key configuration in `application.yml`:

```yaml
# Database
spring.datasource.url: jdbc:postgresql://localhost:5432/makopoker

# JWT
jwt.secret: <your-secret-key>
jwt.expiration-ms: 86400000  # 24 hours
```

## Development

### Running Tests

```bash
./gradlew test
```

### Building

```bash
./gradlew build
```

### Building Docker Image

```bash
docker build -t mako-poker-backend .
```

## Database Migrations

Migrations are managed by Flyway and located in:
`src/main/resources/db/migration/`

Migrations run automatically on application startup.

## Features

- ✅ Real-time poker gameplay
- ✅ AI opponent simulation
- ✅ Multi-player support (2-10 players)
- ✅ JWT authentication
- ✅ REST API
- ✅ PostgreSQL persistence

## Future Enhancements

- [ ] WebSocket support for real-time multiplayer
- [ ] Advanced AI with GTO strategies
- [ ] Hand history tracking
- [ ] Tournament modes
- [ ] Player statistics and analytics
