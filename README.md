# Warehouse Task Optimization Platform - Frontend

A frontend implementation for a Warehouse Task Optimization Platform that allows users to create warehouse layouts, define scenarios, generate tasks, and run optimization algorithms.

## Features

- Interactive environment builder with drag-and-drop interface
- Scenario management for defining optimization parameters
- Task generation with LLM assistance
- Optimization algorithm selection and execution
- Visualization of optimization results

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Axios for API requests
- Zustand for state management
- React Router for navigation
- Framer Motion for animations
- React Query for server state management

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd warehouse-optimization-frontend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development

To run the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Building for Production

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── api/                  # API client code
├── components/           # Reusable UI components
│   ├── common/           # Generic components (Button, Input, etc.)
│   ├── layouts/          # Layout components
│   ├── environment/      # Environment-related components
│   ├── scenario/         # Scenario-related components
│   ├── task/             # Task-related components
│   └── solve/            # Solve-related components
├── hooks/                # Custom hooks
├── pages/                # Page components
├── stores/               # State management
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── assets/               # Static assets
```

## Authentication

The application uses JWT authentication. Users need to register and login to access the platform's features.

## Environment Builder

The Environment Builder allows users to create warehouse layouts by:
- Defining warehouse dimensions
- Placing shelves, dropoffs, and robot stations
- Editing and removing elements
- Auto-generating navigable graphs

## Scenarios & Tasks

- Create scenarios with specific parameters (order volume, priorities, etc.)
- Generate tasks manually or use LLM assistance
- Assign tasks to scenarios for solving

## Algorithms & Solving

- Select optimization algorithms
- Configure algorithm parameters
- Run solves with specified tasks
- Visualize results with metrics
