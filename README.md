# AI Placement Companion

AI Placement Companion is a MERN-based career prep platform for students preparing for placements. It combines resume analysis, job tracking, AI mock interviews, DSA progress, roadmap planning, and analytics in one explainable product.

## Stack

- Frontend: React, Vite, Redux Toolkit, React Router, Tailwind CSS, Axios, React Query, React Hook Form, Framer Motion, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Bcrypt, Multer, Cloudinary, OpenAI/Gemini, Nodemailer, Zod, Winston

## Layout

- `frontend/`: Vite React app
- `backend/`: Express API with service and repository layers
- `.env.example`: environment template

## Run locally

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies with `npm install`.
3. Run both apps with `npm run dev`.

## Current scope

This scaffold includes:

- Auth flow with JWT-ready backend endpoints
- Protected dashboard summary endpoint
- Job and analytics data models
- React dashboard shell with module cards and chart placeholders
- Service/repository separation for interview-friendly structure

## Next build phases

1. Wire MongoDB Atlas and Cloudinary.
2. Add upload, resume parsing, and AI response pipelines.
3. Connect frontend forms, query hooks, and authenticated flows.
4. Add background jobs, notifications, and analytics aggregation.