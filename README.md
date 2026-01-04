# ElectionManager Pro

A comprehensive election management system for administrators to manage upazillas, unions, and voting centers with AI-powered assistance.

## Features

- **Super Admin Panel**: Create and manage Upazilla administrative partitions with specific MongoDB connection strings.
- **Upazilla Admin Panel**:
    - Create Unions within an Upazilla.
    - Add and Update Voting Centers (name, location, Google Maps link, photos).
    - Manage key personnel (Presiding Officers, Police Officers).
- **AI Integration**:
    - Generate security plans for voting centers using Google Gemini AI.
    - Analyze administrative density statistics.
- **Mock Backend**: Uses `localStorage` to simulate a MongoDB backend for demonstration purposes.

## Getting Started

1.  **Install dependencies**: This project uses ES modules via `index.html` import maps (no npm install required for frontend libraries if serving static).
2.  **Environment Variables**:
    - Create a `.env` file (or set environment variables in your deployment) with `API_KEY` for Google Gemini AI.
3.  **Run**: Serve the root directory with any static file server (e.g., `npx serve`, `python3 -m http.server`).

## Default Credentials

### Super Admin
- **Username**: `admin`
- **Password**: `admin`

### Upazilla Admin
- Create a new Upazilla via the Super Admin panel.
- Use the credentials you defined during creation to log in as an Upazilla Admin.

## API Documentation

The application uses a service layer (`services/db.ts`) to abstract database operations.

### Data Models (`types.ts`)

- **Upazilla**: Represents a district subdivision. Contains DB connection info.
- **Union**: A subdivision of an Upazilla.
- **VotingCenter**: A specific polling station location.

### Services

**`services/db.ts`**
- `createUpazilla(upazilla)`: Creates a new administrative zone.
- `createUnion(union)`: Adds a union to an upazilla.
- `createCenter(center)`: Adds a voting center.
- `updateCenter(center)`: Updates an existing voting center's details.
- `getCenters(unionId)`: Retrieves centers for a specific union.

**`services/ai.ts`**
- `generateSecurityPlan(center)`: Generates a text-based security brief.
- `analyzeUpazillaStats(unionCount, centerCount)`: Provides insights on admin density.

## Note on Database

The current implementation uses `localStorage` to simulate MongoDB. In a production environment, the `mongoDbUrl` provided during Upazilla creation would be used by a real Node.js/Express backend to connect to specific MongoDB instances per Upazilla.
"# voting_admin" 
