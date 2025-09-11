-- MySQL initialization script for Restaurant Discovery Engine

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS restaurant_discovery;
USE restaurant_discovery;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON restaurant_discovery.* TO 'restaurant_user'@'%';
FLUSH PRIVILEGES;

-- Log successful initialization
SELECT 'MySQL database initialized for Restaurant Discovery Engine' as message;