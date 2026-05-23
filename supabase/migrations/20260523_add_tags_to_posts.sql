-- Migration: Add Tags column to posts table
-- Allows multiple tags per post for flexible categorization
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
