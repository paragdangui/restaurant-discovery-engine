- # Project Information:

- The frontend use Nuxt 4 with @nuxtjs/tailwindcss
- Backend use NestJs.
- Both frontend and backend use 2 seperate parent folders.
- The full project along with all the containers for frontend, backend, etc should run with just the `docker compose up` command.

## For further Instructions on how the Docker, Backend and Frontend should be created refer the below specifications:

### Backend (NestJS):

- API rate limiting and caching
- Proper error handling and logging
- Swagger/OpenAPI documentation
- Environment configuration
- Health check endpoints

### Frontend (Vue 3):

- Composition API usage
- Component library (Tailwind)
- State management (Pinia)
- Responsive design
- Error boundaries

### Docker Setup:

- Root docker-compose.yml for local development
- Individual Dockerfile for each service (frontend/backend)
- Environment variable management
- Database service (MySQL/MongoDB) if needed
