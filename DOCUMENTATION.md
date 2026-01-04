# Project File Documentation

This document provides a map of the project files to help you navigate the codebase.

## Root Directory

- **`index.html`**: The main entry point. Sets up the DOM, Tailwind CSS, and Import Maps for React/Gemini.
- **`index.tsx`**: React entry point. Mounts the `App` component to the DOM.
- **`App.tsx`**: Main Application Logic. Handles:
    - User Authentication (Login/Logout).
    - Role-based routing (switches between `SuperAdmin` and `UpazillaAdmin` views).
    - Credentials verification.
- **`types.ts`**: TypeScript definitions. Defines interfaces for `Upazilla`, `Union`, `VotingCenter`, and `UserSession`.

## Components (`components/`)

- **`Layout.tsx`**: The main UI shell. Contains the sidebar, mobile navigation, and header. Wraps all other pages.
- **`SuperAdmin.tsx`**: The Dashboard for the Super User.
    - Allows creation of Upazillas.
    - Lists existing Upazillas.
    - Handles mock database connection strings.
- **`UpazillaAdmin.tsx`**: The Dashboard for local admins.
    - Tabbed interface for managing Unions and Centers.
    - Forms for creating/editing Voting Centers.
    - Image upload logic.
    - Integration buttons for AI analysis.

## Services (`services/`)

- **`db.ts`**: The Database Abstraction Layer.
    - Currently implements a mock database using browser `localStorage`.
    - Functions: `getUpazillas`, `createCenter`, `updateCenter`, `uploadImageMock`, etc.
    - Simulates network delay for realism.
- **`ai.ts`**: Google Gemini AI Integration.
    - Connects to Google GenAI SDK.
    - Functions: `generateSecurityPlan` (generates text) and `analyzeUpazillaStats`.

## Metadata

- **`metadata.json`**: Configuration for the application environment, including required permissions (camera, microphone, geolocation).
