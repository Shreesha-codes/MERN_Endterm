// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const auth = require('./middleware/auth'); // Import auth middleware
const authRoutes = require('./routes/authRoutes'); // Import auth routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 

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
// Mongoose Schema and Model (UPDATED to include user ID)
// ----------------------------------------------------
const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // MUST be linked to a user
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Expense = mongoose.model('Expense', expenseSchema);

// ----------------------------------------------------
// Public Routes
// ----------------------------------------------------
app.get('/', (req, res) => {
    res.send('Expense Tracker API is running.');
});
// Authentication Routes (Registration and Login)
app.use('/api/auth', authRoutes);


// ----------------------------------------------------
// Protected Expense Routes (REQUIRES JWT)
// ----------------------------------------------------

// GET all expenses for the LOGGED-IN user
app.get('/api/expenses', auth, async (req, res) => {
  try {
    // Only fetch expenses where the 'user' field matches the authenticated user's ID
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); 
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new expense for the LOGGED-IN user
app.post('/api/expenses', auth, async (req, res) => {
  const { description, amount } = req.body;
  if (!description || !amount) {
    return res.status(400).json({ message: 'Description and amount are required.' });
  }

  // Add the user ID from the token payload to the expense
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