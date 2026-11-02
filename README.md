# AI Chatbot & Authentication Platform

A modern full-stack AI Chatbot application featuring secure user authentication, multi-session chat history, and seamless integration with a Django RAG (Retrieval-Augmented Generation) backend. Built with a **React 19 + Vite** frontend, a **Node.js + Express** API gateway, and **MongoDB**.

---

## Features

- **Secure Authentication & Session Management**:
  - User login verified against MongoDB using `bcrypt` and signed `JWT` tokens.
  - Persistent login sessions with token verification endpoint (`/api/auth/me`).
- **Interactive AI Chatbot**:
  - Floating chatbot widget with multi-session conversation support.
  - Formatted Markdown rendering with syntax-highlighted code blocks and clickable links.
  - Conversation management (switch sessions, rename chats, delete conversations).
  - Pre-configured quick prompt pills for instant answers.
- **Microservice / Proxy Architecture**:
  - Node.js Express server acts as an API gateway, securing requests and proxying chat queries to the Django RAG backend.
- **Responsive & Modern UI**:
  - Sleek glassmorphic dark-mode interface built with React 19 and Lucide icons.
  - Ambient background animations and responsive layout for desktop and mobile.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Lucide React](https://lucide.dev/)
- **Backend API Gateway**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [Mongoose](https://mongoosejs.com/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Database**: [MongoDB](https://www.mongodb.com/) (Atlas or local instance)
- **AI Backend Integration**: Django RAG REST API

---

## Project Structure

```text
chatbotfrontend/
├── client/                     # Frontend React application (Vite)
│   ├── public/                 # Static assets (favicons, icons)
│   ├── src/
│   │   ├── assets/             # Images and SVG icons
│   │   ├── components/         # React components (Navbar, Login, Dashboard, ChatbotWidget, Footer)
│   │   ├── App.jsx             # Main application component & auth router
│   │   ├── main.jsx            # Application entry point
│   │   └── App.css             # Main styling & animations
│   ├── .env.example            # Client environment variable template
│   ├── package.json            # Client dependencies and scripts
│   └── vite.config.js          # Vite build and dev configuration
│
├── server/                     # Backend API server (Express + MongoDB)
│   ├── config/
│   │   └── db.js               # MongoDB connection logic
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   └── User.js             # Mongoose User model
│   ├── routes/
│   │   ├── auth.js             # Login and user verification endpoints
│   │   └── chat.js             # Chatbot proxy routes to Django RAG backend
│   ├── .env.example            # Server environment variable template
│   ├── package.json            # Server dependencies and scripts
│   └── server.js               # Express application entry point
│
├── .gitignore                  # Git ignore rules for root, client, and server
├── package.json                # Root package configuration with concurrent runners
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or later recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or later)
- Access to a MongoDB database (MongoDB Atlas connection string or local MongoDB instance)
- (Optional) Running instance of the Django RAG backend (defaults to `http://localhost:8000/api/v1`)

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Install all dependencies** (root, client, and server):
   ```bash
   npm run install:all
   ```
   *Or install individually:*
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Configure Environment Variables**:

   **Server Configuration:**
   Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   Open `server/.env` and supply your database credentials and secret key:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority
   JWT_SECRET=your_secure_random_jwt_secret_key
   DJANGO_API_BASE_URL=http://localhost:8000/api/v1
   ```

   **Client Configuration:**
   Copy `client/.env.example` to `client/.env` (optional for default localhost ports):
   ```bash
   cp client/.env.example client/.env
   ```
   ```env
   VITE_AUTH_API_BASE_URL=http://localhost:5000/api/auth
   VITE_CHAT_API_BASE_URL=http://localhost:5000/api/chat
   VITE_DJANGO_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Start the Development Servers**:
   Run both frontend and backend concurrently from the root directory:
   ```bash
   npm run dev
   ```
   - Client will start at: `http://localhost:5173`
   - Server will run at: `http://localhost:5000`

---

## Environment Variables Reference

### Backend (`server/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port number for the Express backend server | `5000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `MONGODB_URI` | MongoDB connection URI string (Atlas or local) | **Required** |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | **Required** |
| `DJANGO_API_BASE_URL`| Base URL for the Django RAG backend service | `http://localhost:8000/api/v1` |

### Frontend (`client/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_AUTH_API_BASE_URL` | Express auth endpoints URL | `/api/auth` (proxied) |
| `VITE_CHAT_API_BASE_URL` | Express chat proxy endpoints URL | `/api/chat` (proxied) |
| `VITE_DJANGO_API_BASE_URL`| Direct Django API URL (if required) | `http://localhost:8000/api/v1` |

---

## Render Deployment Guide

To deploy this full-stack application as a single Web Service on [Render](https://render.com/):

1. **New Web Service**:
   - Connect your GitHub repository (`devstarkedge/Chatbot-frontend`).
2. **Build & Start Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   In the Render dashboard under **Environment**, add:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<Your secure random string>`
   - `DJANGO_API_BASE_URL`: `http://localhost:8000/api/v1` (or your deployed Django backend URL)

Render will automatically run `npm run build` (which installs all server & client dependencies and compiles the Vite React frontend), then launch `node server/server.js`. The Express server will serve both the React app and the API endpoints on the same domain.

---

## Available NPM Scripts

From the root directory:
- `npm run dev`: Runs both client (`vite`) and server (`node server.js`) concurrently.
- `npm run dev:server`: Runs only the backend server.
- `npm run dev:client`: Runs only the Vite client development server.
- `npm run install:all`: Installs dependencies for root, client, and server in one command.
- `npm run build:client`: Bundles the React application for production.
- `npm start`: Starts the backend server in production mode.

---

## API Endpoints Overview

### Authentication Routes (`/api/auth`)
- `POST /api/auth/login`: Authenticates user credentials against MongoDB and issues a signed JWT token.
- `GET /api/auth/me`: Validates JWT token and returns the current user profile.

### Chat Proxy Routes (`/api/chat`)
- `POST /api/chat/ask`: Proxies user question with user identity metadata to the Django RAG AI service.
- `GET /api/chat/chats`: Retrieves user chat sessions from Django backend.
- `GET /api/chat/chats/:sessionId`: Retrieves messages for a specific conversation session.
- `POST /api/chat/chats/:sessionId/rename`: Renames a chat session.
- `DELETE /api/chat/chats/:sessionId/delete`: Deletes a chat session.
- `GET /api/chat/health`: Checks connectivity status of the AI backend.

---

## Security Notes

- **Never commit `.env` files**: Real credentials and secrets should remain in your local `.env` files, which are safely excluded by `.gitignore`.
- Always replace `JWT_SECRET` with a strong cryptographic random key in production.

---

## License

This project is licensed under the ISC License.

