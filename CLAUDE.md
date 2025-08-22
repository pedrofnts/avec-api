# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm run start

# Lint code (ESLint available)
npm run lint
```

## Project Architecture

This is a Node.js/Express API for a beauty salon management system (`beauty-admin-api`). The application acts as a proxy/wrapper around the avec.beauty platform, providing standardized REST endpoints.

### Core Structure

- **Controllers** (`src/controllers/`): Handle HTTP requests and business logic
- **Routes** (`src/routes/`): Define API endpoints and route handlers  
- **Utils** (`src/utils/`): Shared utilities, including status mapping functions
- **Entry Point**: `src/index.ts` - Express server setup with CORS and routing

### Key Components

**Authentication & Session Management:**
- Uses session tokens passed via `Authorization: Bearer <token>` headers
- Converts tokens to cookie format for avec.beauty API calls: `ci3_session=${authToken}`
- Organization structure selection via `x-organization-structure` header (defaults to "1")

**External API Integration:**
- Base URL: `https://admin.avec.beauty` (configurable via `API_BASE_URL` env var)
- Timeout: 30 seconds (configurable via `API_TIMEOUT` env var)
- All requests proxy to avec.beauty with proper headers and cookie authentication

**Data Processing:**
- Scheduler controller performs complex data transformation, fetching detailed appointment info
- Status mapping utility (`utils/statusMapper.ts`) handles appointment status standardization
- Date/time conversions from minutes to HH:MM format

### API Domains

1. **Scheduler** (`/api/scheduler/*`): Appointment management
2. **Clients** (`/api/clients/*`): Customer data and search
3. **Procedures** (`/api/procedures/*`): Service/treatment management  
4. **Auth** (`/api/auth/*`): Authentication endpoints
5. **Organizational Structures** (`/api/organizational-structures/*`): Business entity management

### Environment Variables

- `PORT`: Server port (default: 3000)
- `API_BASE_URL`: External API base URL (default: https://admin.avec.beauty)
- `API_TIMEOUT`: Request timeout in milliseconds (default: 30000)

### Development Notes

- TypeScript with strict mode enabled
- Output directory: `dist/`
- No test framework currently configured
- Uses axios for HTTP requests with detailed error logging
- Request/response logging middleware enabled for debugging