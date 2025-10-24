const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const auth = require('./middleware/auth'); // Import auth middleware
const authRoutes = require('./routes/authRoutes'); // Import auth routes
// Removed unused User import to simplify, assuming User model is imported in routes or is defined elsewhere

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (CORRECTED CORS)
// ----------------------------------------------------
const ALLOWED_ORIGINS = [
    // The main production domain 
    'https://mern-endterm.vercel.app',       
    // The dynamic preview/staging domain 
    'https://mern-endterm-czx9.vercel.app',
    // Allow localhost for local development
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like server-to-server)
        if (!origin) return callback(null, true);
        
        // Allow if the origin is in our specific list OR ends with .vercel.app
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            const msg = `Origin ${origin} is not allowed by the server's CORS policy.`;
            return callback(new Error(msg), false);
        }
    },
    credentials: true 
}));

app.use(express.json()); 
// ----------------------------------------------------


// ----------------------------------------------------
// MongoDB Connection
// ----------------------------------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ----------------------------------------------------
// Mongoose Schema and Model (Assuming Expense model needs to be defined here)
// ----------------------------------------------------
const expenseSchema = new mongoose.Schema({
  // Note: If User model is not defined/imported, Mongoose will throw an error
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Expense = mongoose.model('Expense', expenseSchema);

// ----------------------------------------------------
// Public Routes & AUTH ROUTES (CRITICAL ROUTE FIX APPLIED HERE)
// ----------------------------------------------------
app.get('/', (req, res) => {
    // This is the root of your backend server
    res.send('Expense Tracker API is running.');
});

// Authentication Routes (Registration and Login)
// This MUST be app.use('/auth', ...) so that the Vercel proxy (/api) + /auth 
// results in the desired /api/auth route.
app.use('/auth', authRoutes);


// ----------------------------------------------------
// Protected Expense Routes (REQUIRES JWT) (CRITICAL ROUTE FIX APPLIED HERE)
// ----------------------------------------------------

// GET all expenses for the LOGGED-IN user
// This MUST be app.get('/expenses', ...) so that the Vercel proxy (/api) + /expenses 
// results in the desired /api/expenses route.
app.get('/expenses', auth, async (req, res) => {
  try {
    // Fix applied to Expense model usage
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); 
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new expense for the LOGGED-IN user
app.post('/expenses', auth, async (req, res) => {
  const { description, amount } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ message: 'Description and amount are required.' });
  }
  const newExpense = new Expense({ 
    user: req.user.id,
    description, 
    amount: Number(amount) 
  });
  try {
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
