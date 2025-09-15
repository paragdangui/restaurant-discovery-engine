# Project Overview

This is a full-stack web application for a restaurant discovery engine. It allows users to search for restaurants, view details, and see them on a map.

**Frontend:**

*   **Framework:** Nuxt 4 (with Vue 3)
*   **Styling:** Tailwind CSS
*   **State Management:** Pinia
*   **Key Components:**
    *   `RestaurantCard.vue`: Displays a single restaurant in a list.
    *   `RestaurantDetailModal.vue`: Shows detailed information about a restaurant.
    *   `RestaurantMapView.vue`: Displays restaurants on a map.
    *   `RestaurantSearchBar.vue`: The main search input for finding restaurants.

**Backend:**

*   **Framework:** NestJS
*   **Database:** MySQL (with TypeORM)
*   **API:** RESTful API with Swagger/OpenAPI documentation.
*   **Key Features:**
    *   CRUD operations for restaurants.
    *   Health check endpoints.
    *   API rate limiting and caching with Redis.

**DevOps:**

*   **Containerization:** Docker and Docker Compose
*   **Orchestration:** A single `docker-compose.yml` file manages all services (frontend, backend, MySQL, Redis).
*   **Database Initialization:** The `scripts/init-mysql.sql` script is used to initialize the database schema.

# Building and Running

The project is fully containerized and can be run with a single command:

```bash
docker compose up
```

This will start all the services, including the database, backend, and frontend.

**Development Commands:**

*   **Backend:**
    ```bash
    cd backend
    npm run start:dev
    ```
*   **Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

**Testing:**

*   **Backend:**
    ```bash
    cd backend
    npm run test
    ```

# Development Conventions

*   **Code Style:** The project uses Prettier for code formatting.
*   **Linting:** ESLint is used for linting the backend code.
*   **API Documentation:** The backend API is documented using Swagger/OpenAPI, available at `http://localhost:3001/api/docs`.
*   **Environment Variables:** Environment variables are managed using `.env` files. An example file (`.env.example`) is provided at the root of the project.
