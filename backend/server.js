const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const auth = require('./middleware/auth'); // Import auth middleware
const authRoutes = require('./routes/authRoutes'); // Import auth routes
// Ensure you have a User model file at './models/User'
// const User = require('./models/User'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (CORRECTED CORS)
// ----------------------------------------------------
const ALLOWED_ORIGINS = [
    'https://mern-endterm.vercel.app',       
    'https://mern-endterm-czx9.vercel.app', 
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        // This allows specific origins AND any Vercel preview domain (*.vercel.app)
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
// Mongoose Schema and Model 
// NOTE: Re-defining Expense model here for simplicity
// ----------------------------------------------------
const expenseSchema = new mongoose.Schema({
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
// Public Routes & AUTH ROUTES (FIXED MOUNT POINT)
// ----------------------------------------------------
app.get('/', (req, res) => {
    res.send('Expense Tracker API is running.');
});

// FIX: Authentication routes mounted at '/auth'. 
// Combined with vercel.json's proxy, the deployed path becomes /api/auth.
app.use('/auth', authRoutes);


// ----------------------------------------------------
// Protected Expense Routes (FIXED MOUNT POINT)
// ----------------------------------------------------

// FIX: Expense GET route mounted at '/expenses'. Deployed path: /api/expenses
app.get('/expenses', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); 
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FIX: Expense POST route mounted at '/expenses'. Deployed path: /api/expenses
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
