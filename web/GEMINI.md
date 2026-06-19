# Gemini Instructional Context - Iniciencia

This project is a React-based web application for managing Scientific Initiation (Iniciação Científica) projects, likely as part of a TCC (Trabalho de Conclusão de Curso). It features a modern, interactive dashboard with project tracking, chat, and document management.

## Project Overview

- **Main Technologies:** React 18, Vite, React Router 7, Tailwind CSS 4, Radix UI.
- **UI Components:** Uses Radix UI primitives with custom styling and Lucide React icons.
- **State Management:** Uses React Context (`AuthProvider`) for authentication and local component state for UI logic.
- **API Integration:** Custom `fetch` wrapper in `src/app/services/api.js` with bearer token authentication.
- **Styling:** Modular CSS imports in `src/styles/index.css`, combining Tailwind with custom CSS variables and animations.

## Directory Structure

- `src/app/components/`: Reusable UI components. `src/app/components/ui/` contains Radix-based primitives.
- `src/app/hooks/`: Custom React hooks (e.g., `useAuth`, `useAsyncData`).
- `src/app/layouts/`: Page layouts (e.g., `DashboardLayout`).
- `src/app/pages/`: Main view components for different routes.
- `src/app/providers/`: Context providers (e.g., `AuthProvider`).
- `src/app/services/`: Service layer for API communication (e.g., `authService`, `projectService`).
- `src/app/utils/`: Utility functions, adapters, and formatters.
- `src/styles/`: Global styles, theme variables, and Tailwind configuration.

## Building and Running

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

## Development Conventions

- **API Calls:** Always use the `api` utility from `src/app/services/api.js`. Group related API calls into service files within `src/app/services/`.
- **Authentication:** Use the `useAuth` hook to access user state and authentication methods. Protected routes are handled by the `ProtectedRoute` component.
- **Routing:** Define routes in `src/app/routes.jsx` using `createBrowserRouter`.
- **Components:** Favor functional components with hooks. Use Radix UI primitives for complex UI elements like dialogs, selects, and dropdowns.
- **Styling:** Use Tailwind CSS for most styling. Project-specific themes and animations are defined in `src/styles/`.
- **Naming:** Follow camelCase for variables and functions, and PascalCase for components and files.

## Environment Variables

- `VITE_API_URL`: The base URL for the backend API (defaults to `http://localhost:8080`).
