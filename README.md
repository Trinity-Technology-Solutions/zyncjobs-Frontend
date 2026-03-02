# Zyncjobs Frontend

React + TypeScript + Vite frontend for Zyncjobs job portal.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Application will run on `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit

## Backend Connection

Make sure the backend API is running on `http://localhost:5000` or update `VITE_API_URL` in `.env` file.
