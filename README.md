# Restaurant Discovery Engine

A modern full-stack web application for discovering and exploring restaurants, built with NestJS backend and Nuxt 4 frontend.

## 🏗️ Architecture

- **Frontend**: Nuxt 4 with Vue 3, Tailwind CSS v4.1, Pinia for state management
- **Backend**: NestJS with TypeScript, TypeORM, Swagger/OpenAPI documentation
- **Database**: MySQL 8.0 with TypeORM entities and relationships
- **Cache**: Redis for improved performance
- **Containerization**: Docker with multi-stage builds

## ✨ Features

### Backend (NestJS)
- ✅ RESTful API with full CRUD operations
- ✅ TypeORM with MySQL database integration
- ✅ API rate limiting and Redis caching
- ✅ Swagger/OpenAPI documentation
- ✅ Environment configuration
- ✅ Health check endpoints with database connectivity
- ✅ Input validation and error handling
- ✅ Database seeding with sample data
- ✅ TypeScript support

### Frontend (Nuxt 4)
- ✅ Server-side rendering (SSR)
- ✅ Composition API usage
- ✅ Tailwind CSS v4.1 for styling
- ✅ Pinia for state management
- ✅ Responsive design
- ✅ Error boundaries and loading states

### DevOps
- ✅ Docker containerization with single command setup
- ✅ Docker Compose for complete application stack
- ✅ Multi-stage Docker builds for optimization
- ✅ Health checks for all services (MySQL, Redis, API, Frontend)
- ✅ Environment variable management
- ✅ Automatic database initialization and seeding

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### One-Command Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd restaurant-discovery-engine
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start the entire application**
   ```bash
   docker compose up
   ```

That's it! The application will automatically:
- 🐳 Start MySQL database
- 🔥 Start Redis cache
- 🚀 Build and start the NestJS backend
- 🎨 Build and start the Nuxt frontend
- 📊 Initialize database with sample data
- ✅ Run health checks on all services

### Docker Commands

```bash
# Start all services (with logs)
docker compose up

# Start all services in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild and start
docker compose up --build
```

## 📡 API Endpoints

- `GET /` - Application info
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `GET /restaurants` - List all restaurants
- `POST /restaurants` - Create new restaurant
- `GET /restaurants/:id` - Get restaurant by ID
- `PATCH /restaurants/:id` - Update restaurant
- `DELETE /restaurants/:id` - Delete restaurant

**API Documentation**: http://localhost:3001/api/docs

## 🌐 URLs

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | http://localhost:3000 | TBD |
| Backend API | http://localhost:3001 | TBD |
| API Docs | http://localhost:3001/api/docs | TBD |
| MySQL | mysql://localhost:3306 | TBD |
| Redis | redis://localhost:6380 | TBD |

## 📁 Project Structure

```
restaurant-discovery-engine/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── restaurants/     # Restaurant module
│   │   ├── health/          # Health check module
│   │   └── common/          # Shared utilities
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Nuxt 4 frontend application
│   ├── components/          # Vue components
│   ├── pages/              # Application pages
│   ├── layouts/            # Layout components
│   ├── assets/             # Static assets
│   ├── Dockerfile
│   └── package.json
├── scripts/                # Utility scripts
├── docker-compose.yml      # Container orchestration
└── README.md
```

## 🔧 Development

### Backend Commands
```bash
cd backend
npm run start:dev    # Development server
npm run build        # Build for production
npm run start:prod   # Production server
npm run lint         # Run linter
npm run test         # Run tests
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run generate     # Generate static site
npm run typecheck    # Type checking
```

## 🐳 Docker

### Individual Services
```bash
# Build backend
docker build -t restaurant-backend ./backend

# Build frontend  
docker build -t restaurant-frontend ./frontend

# Run backend
docker run -p 3001:3001 restaurant-backend

# Run frontend
docker run -p 3000:3000 restaurant-frontend
```

## 🔒 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_PORT` | Frontend port | `3000` |
| `BACKEND_PORT` | Backend port | `3001` |
| `DB_PORT` | MySQL port | `3306` |
| `REDIS_PORT` | Redis port | `6380` |
| `DB_ROOT_PASSWORD` | MySQL root password | `rootpassword` |
| `DB_DATABASE` | Database name | `restaurant_discovery` |
| `DB_USERNAME` | Database user | `restaurant_user` |
| `DB_PASSWORD` | Database password | `password` |
| `JWT_SECRET` | JWT signing secret | Required |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests (when added)
cd frontend
npm run test
```

## 🚀 Deployment

### Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Update production values
3. Ensure secure JWT_SECRET
4. Configure production MySQL database credentials
5. Set appropriate Redis connection details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.