// server.js (Final Code with DELETE route)

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const auth = require('./middleware/auth'); 
const authRoutes = require('./routes/authRoutes'); 
const User = require('./models/User'); // Required for Expense ref

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration (Keep this robust CORS configuration) ---
const ALLOWED_ORIGINS = [
    'https://mern-endterm2.onrender.com', 
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (
            ALLOWED_ORIGINS.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        } else {
            const msg = `Origin ${origin} is not allowed by the server's CORS policy.`;
            return callback(new Error(msg), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true 
}));

app.use(express.json()); 

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


// --- Mongoose Schema and Model (Expense) ---
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


// --- Public Routes & AUTH ROUTES ---
app.get('/', (req, res) => {
    res.send('Expense Tracker API is running.');
});
// The actual path the frontend uses: /api/auth/login
app.use('/api/auth', authRoutes);


// --- Protected Expense Routes (REQUIRES JWT) ---

// GET all expenses for the LOGGED-IN user (READ)
app.get('/api/expenses', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); 
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new expense for the LOGGED-IN user (CREATE)
app.post('/api/expenses', auth, async (req, res) => {
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

// DELETE an expense by ID (DELETE) 👈 NEW FEATURE
app.delete('/api/expenses/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ 
            _id: req.params.id, 
            user: req.user.id // Ensure only the owner can delete it
        });

        if (!expense) {
            // Either the ID was wrong or the expense did not belong to the user
            return res.status(404).json({ message: 'Expense not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Expense deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});