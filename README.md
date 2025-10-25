🚀 MERN Expense Tracker (Cosmic Station Edition):

Project Overview:

The MERN Expense Tracker is a secure, full-stack web application designed to help users monitor and manage their personal expenses. Built with the MERN stack (MongoDB, Express.js, React, Node.js), this application features secure JWT-based user authentication and a responsive UI inspired by a Space Station/Cosmic theme.

Key Features Implemented:
🔒 Secure User Authentication: Register and Login via JSON Web Tokens (JWT) and bcrypt password hashing.

➕ Full CRUD Operations: Users can Create, Read, Update, and Delete their own expense records.

📊 Advanced Filtering: Expenses can be filtered dynamically by Year, Month, or Day.

🎨 Animated UI: Modern, dark-themed UI with clean tables, subtle animations, and a distinct visual style.

🔗 Deployment Ready: Configured with robust CORS policies to ensure seamless communication between separate Render/Vercel services.

🛠️ Tech Stack
Frontend (Client)
React: For the dynamic, component-based user interface.

JavaScript (Fetch API): For making asynchronous API requests to the backend.

HTML/CSS: Custom styling for the Space Station theme.

Backend (Server)
Node.js & Express.js: The application's server and REST API framework.

MongoDB & Mongoose: NoSQL database and Object Data Modeling (ODM) for managing structured expense data.

JSON Web Tokens (JWT): Used for stateless, secure user sessions.

Bcrypt.js: Used to hash and secure user passwords in the database.

CORS: Explicitly configured to allow cross-origin requests from the deployed frontend.

🔗 Live Application & Deployment
This application is typically deployed across two separate services for maximum stability:

Component,Example Deployment Platform,Example Live URL
Frontend (React),Vercel / Render Static Site,https://mern-endterm2.onrender.com
Backend (Express API),Render Web Service,https://mern-endterm1.onrender.com


Database Setup
The backend connects to MongoDB Atlas using the MONGO_URI environment variable.

The system uses two core models: User and Expense.

⚙️ Setup and Installation
Prerequisites
You must have Node.js and npm installed.

Clone the repository:git clone https://github.com/Shreesha-codes/MERN_Endterm.git
cd MERN_Endterm

npm install

npx create-react-app client # If not already done
npm install --prefix client

MONGO_URI=mongodb+srv://<username>:<password>@cluster0.dk5pkej.mongodb.net/expense_tracker
JWT_SECRET=YOUR_VERY_LONG_COMPLEX_SECRET_STRING_HERE
PORT=5000

Local Run Instructions
Run Backend (in Terminal 1):

Bash

npm run server
# Server should start on port 5000
Run Frontend (in Terminal 2):

Bash

npm run client
# Client should open on port 3000

🔑 Backend API Endpoints
All endpoints are prefixed with /api.

Method,Route,Description,Auth Required?
POST,/api/auth/register,Creates a new user account.,No
POST,/api/auth/login,Authenticates user; returns JWT token.,No
GET,/api/expenses,READ: Fetches all expenses for the authenticated user. Accepts ?year=Y&month=M&day=D query params.,Yes
POST,/api/expenses,CREATE: Adds a new expense record.,Yes
PATCH,/api/expenses/:id,UPDATE: Modifies an existing expense record.,Yes
DELETE,/api/expenses/:id,DELETE: Removes an expense record.,Yes

⚠️ Important Deployment Note (CORS/JWT)
Cross-Origin Fix: The backend (server.js) includes a custom cors configuration that specifically allows requests from the Vercel/Render frontend domains and uses credentials: true.

Frontend Fetch: The frontend (App.js) mirrors this by adding credentials: 'include' to every API call, ensuring the x-auth-token (JWT) is sent and the response is accepted by the browser.