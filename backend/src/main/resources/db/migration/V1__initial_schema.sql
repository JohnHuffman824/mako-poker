-- V1__initial_schema.sql
-- Initial database schema for Poker GTO application

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

-- User roles table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- Sessions table (poker playing sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hands_played INTEGER NOT NULL DEFAULT 0,
    session_pnl DECIMAL(12, 2) DEFAULT 0,
    gto_adherence DECIMAL(5, 2) DEFAULT 0,
    game_type VARCHAR(50) DEFAULT 'NLHE',
    blinds VARCHAR(50),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- Scenarios table (individual hands for analysis)
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hole_cards VARCHAR(10) NOT NULL,
    community_cards VARCHAR(25),
    position VARCHAR(10) NOT NULL,
    player_count INTEGER NOT NULL,
    player_stack DECIMAL(12, 2) NOT NULL,
    pot_size DECIMAL(12, 2) NOT NULL,
    blinds VARCHAR(20) NOT NULL,
    street VARCHAR(10) NOT NULL DEFAULT 'PREFLOP',
    effective_stack DECIMAL(12, 2),
    action_facing VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_session_id ON scenarios(session_id);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at DESC);

-- Recommendations table (GTO analysis results)
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    recommended_action VARCHAR(20) NOT NULL,
    action_confidence DECIMAL(5, 2) NOT NULL,
    fold_pct DECIMAL(5, 2) DEFAULT 0,
    call_pct DECIMAL(5, 2) DEFAULT 0,
    raise_pct DECIMAL(5, 2) DEFAULT 0,
    recommended_bet_size DECIMAL(12, 2),
    equity DECIMAL(5, 4) NOT NULL,
    expected_value DECIMAL(12, 4),
    pot_odds VARCHAR(20),
    calculation_time_ms INTEGER,
    solver_iterations INTEGER,
    solver_depth INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_scenario_id ON recommendations(scenario_id);

-- Solver cache table (for pre-computed solutions)
CREATE TABLE solver_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_hash VARCHAR(64) NOT NULL UNIQUE,
    strategy_data JSONB NOT NULL,
    iterations INTEGER NOT NULL,
    abstraction_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    access_count BIGINT DEFAULT 0
);

CREATE INDEX idx_solver_cache_hash ON solver_cache(situation_hash);
CREATE INDEX idx_solver_cache_accessed_at ON solver_cache(accessed_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

