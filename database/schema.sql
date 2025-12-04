-- ============================================
-- WhatWhereWhen2 Database Schema
-- PostgreSQL Database Schema for Game Management
-- ============================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: experts
-- Stores information about game experts (знатоки)
-- ============================================
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'playing')),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: viewers
-- Stores information about viewers who submit questions
-- ============================================
CREATE TABLE viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: questions
-- Stores questions submitted by viewers
-- ============================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID NOT NULL REFERENCES viewers(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'video', 'image', 'audio')),
    answer TEXT NOT NULL,
    keywords TEXT[], -- Array of keywords for search
    media_url VARCHAR(500), -- URL to video/image/audio file
    media_thumbnail_url VARCHAR(500), -- Thumbnail for video/image
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5), -- 1-5 scale
    category VARCHAR(100), -- Optional category (history, science, etc.)
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: games
-- Stores game sessions
-- ============================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    experts_score INTEGER DEFAULT 0 CHECK (experts_score >= 0),
    viewers_score INTEGER DEFAULT 0 CHECK (viewers_score >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'finished', 'cancelled')),
    current_round_number INTEGER DEFAULT 0,
    max_rounds INTEGER DEFAULT 13, -- Standard game has 13 rounds
    game_date DATE,
    season_number INTEGER,
    episode_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: game_experts
-- Junction table: Many-to-Many relationship between games and experts
-- ============================================
CREATE TABLE game_experts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
    position INTEGER, -- Position at the table (1-6)
    is_captain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, expert_id)
);

-- ============================================
-- Table: rounds
-- Stores individual rounds within a game
-- ============================================
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    round_number INTEGER NOT NULL,
    is_answered_correctly BOOLEAN DEFAULT FALSE,
    experts_answer TEXT, -- Answer given by experts
    time_started TIMESTAMP WITH TIME ZONE,
    time_answered TIMESTAMP WITH TIME ZONE,
    time_limit_seconds INTEGER DEFAULT 60, -- Time limit for answering
    display_status JSONB DEFAULT '{}'::jsonb, -- Current display state on TV client
    -- Example display_status structure:
    -- {
    --   "content": "question",
    --   "media": "video_file.mp4",
    --   "show_question": true,
    --   "show_timer": true,
    --   "timer_seconds": 45,
    --   "show_experts": true,
    --   "show_score": true,
    --   "sound_playing": "question_intro.mp3"
    -- }
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'question_shown', 'thinking', 'answered', 'result_shown', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, round_number)
);

-- ============================================
-- Table: round_votes
-- Stores votes from experts during a round (if voting is implemented)
-- ============================================
CREATE TABLE round_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
    vote TEXT, -- The answer/vote given by the expert
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, expert_id)
);

-- ============================================
-- Table: game_events
-- Stores real-time events for game synchronization
-- ============================================
CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'score_update', 'round_start', 'round_end', 'question_shown', etc.
    event_data JSONB DEFAULT '{}'::jsonb, -- Additional event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for better query performance
-- ============================================

-- Experts indexes
CREATE INDEX idx_experts_status ON experts(status);
CREATE INDEX idx_experts_name ON experts(name);

-- Viewers indexes
CREATE INDEX idx_viewers_city ON viewers(city);
CREATE INDEX idx_viewers_name ON viewers(name);

-- Questions indexes
CREATE INDEX idx_questions_viewer_id ON questions(viewer_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_is_approved ON questions(is_approved);
CREATE INDEX idx_questions_keywords ON questions USING GIN(keywords);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_at ON questions(created_at);

-- Games indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_game_date ON games(game_date);
CREATE INDEX idx_games_season_episode ON games(season_number, episode_number);

-- Game experts indexes
CREATE INDEX idx_game_experts_game_id ON game_experts(game_id);
CREATE INDEX idx_game_experts_expert_id ON game_experts(expert_id);

-- Rounds indexes
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_rounds_question_id ON rounds(question_id);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_display_status ON rounds USING GIN(display_status);

-- Round votes indexes
CREATE INDEX idx_round_votes_round_id ON round_votes(round_id);
CREATE INDEX idx_round_votes_expert_id ON round_votes(expert_id);

-- Game events indexes
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_round_id ON game_events(round_id);
CREATE INDEX idx_game_events_event_type ON game_events(event_type);
CREATE INDEX idx_game_events_created_at ON game_events(created_at);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON experts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data (Optional - for testing)
-- ============================================

-- Insert sample experts
INSERT INTO experts (name, status) VALUES
    ('Александр Друзь', 'active'),
    ('Максим Поташев', 'active'),
    ('Андрей Козлов', 'active'),
    ('Виктор Сиднев', 'active'),
    ('Борис Бурда', 'active'),
    ('Алесь Мухин', 'active');

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE experts IS 'Game experts (знатоки) who participate in games';
COMMENT ON TABLE viewers IS 'Viewers who submit questions';
COMMENT ON TABLE questions IS 'Questions submitted by viewers for the game';
COMMENT ON TABLE games IS 'Game sessions with scores and status';
COMMENT ON TABLE game_experts IS 'Junction table linking games to participating experts';
COMMENT ON TABLE rounds IS 'Individual rounds within a game with display status for TV client';
COMMENT ON TABLE round_votes IS 'Votes/answers from experts during rounds';
COMMENT ON TABLE game_events IS 'Real-time events for game synchronization and history';

COMMENT ON COLUMN rounds.display_status IS 'JSONB field storing current display state on TV client including content type, media files, timer, and UI visibility flags';
COMMENT ON COLUMN game_events.event_data IS 'JSONB field storing additional event-specific data for real-time synchronization';

