-- MySQL initialization script for Restaurant Discovery Engine

USE restaurant_discovery;

-- Insert sample data into restaurants table
-- Note: TypeORM will automatically create the table structure
-- This script only inserts sample data that will be available after the table is created

-- We need to wait for the application to create the tables first
-- This is handled by TypeORM synchronization in development mode

-- Sample restaurants data will be inserted via a separate SQL file or API calls
-- since TypeORM will create the table schema automatically

-- Create indexes for better performance (will be created by TypeORM decorators)
-- These are just documentation of what TypeORM will create:
-- 
-- CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine);
-- CREATE INDEX idx_restaurants_rating ON restaurants(rating);
-- CREATE INDEX idx_restaurants_created_at ON restaurants(createdAt);
-- CREATE FULLTEXT INDEX idx_restaurants_search ON restaurants(name, description);

-- Grant additional permissions if needed
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_discovery.* TO 'restaurant_user'@'%';
FLUSH PRIVILEGES;

-- Log successful initialization
SELECT 'MySQL database initialized for Restaurant Discovery Engine' as message;