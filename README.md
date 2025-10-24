simple MERN Expense Tracker with JWT Authentication 

This project is a fully authenticated, full-stack expense tracking application built using the MERN stack (MongoDB, Express, React, Node.js). It demonstrates proficiency in core web development concepts, including secure user authentication (JWT), data persistence, and responsive UI design.



Frontend Application (REQUIRED SUBMISSION LINK)

[PASTE YOUR FINAL LIVE APP URL HERE]

Backend API Endpoint : https://mern-endterm1.onrender.com/

GitHub Repository:

https://github.com/Shreesha-codes/MERN_Endterm


Core Features Implemented

The application provides multi-user support, ensuring that user data is secure and isolated.

JWT-Based Authentication:

Registration (/auth/register): Creates new users with securely hashed passwords (using bcryptjs).

Login (/auth/login): Authenticates users and issues a short-lived JSON Web Token (JWT).

Authorization: The JWT is stored on the client side and sent with every request to access protected routes.

Data Authorization & Isolation:

The auth middleware protects the expense routes.

All expense documents in MongoDB are linked to a specific userId.

Users can only Create (POST) and Read (GET) expenses belonging to their own account.

CRUD Functionality (Create & Read):

Create (POST): Users can submit new expense entries (description and amount).

Read (GET): Fetches and displays the user's list of expenses in a clean, high-contrast table format.

Responsive UI/UX: Built with React and clean CSS, featuring a fluid, card-based layout optimized for both desktop and mobile devices.

Technology Stack

Frontend (R)

React.js

Single Page Application (SPA) for the user interface.

Backend (E & N)

Node.js & Express.js

Creates the RESTful API endpoints for authentication and data operations.

Database (M)

MongoDB Atlas

Cloud-hosted NoSQL database for flexible data storage.

Security

JWT, bcryptjs

Securing user passwords and stateless session management.

Local Setup and Installation

Follow these steps to run the project on your local machine:

Prerequisites

Node.js (LTS recommended)

MongoDB Atlas Account (for cloud database)

Backend Setup (backend/)

Navigate to the backend directory: cd backend

Install dependencies: npm install

Create .env file: Create a file named .env in the backend/ folder and add your credentials:

MONGO_URI=mongodb+srv://basaravanishreesha_db_user:Shreesha1234@cluster0.dk5pkej.mongodb.net/


Run the server: npm run dev (Runs on http://localhost:5000)

Frontend Setup (frontend/)

Navigate to the frontend directory: cd frontend

Install dependencies: npm install

Set API URL: In frontend/src/App.js, temporarily set API_BASE_URL to your local backend:

const API_BASE_URL = 'http://localhost:5000/api';


Run the client: npm start (Runs on http://localhost:3000)

Deployment Instructions (Monorepo)

The project is structured as a Monorepo, meaning the Frontend and Backend are in separate folders but share the same repository.

API Deployment (Render):

Deploy the backend folder as a Web Service.

Crucial: Set MONGO_URI and JWT_SECRET as Environment Variables on the host.

The routing is configured via the vercel.json file in the repository root, which redirects /api/* traffic to the Node.js server.

App Deployment (render):

Deploy the frontend folder as a Static Site.

Crucial: During setup, set the Root Directory or Base Directory to frontend.

The App.js file is updated to use the live API URL obtained from the first deployment ste