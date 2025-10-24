const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
// Assuming the following files exist in your project structure:
const auth = require('./middleware/auth'); 
const authRoutes = require('./routes/authRoutes'); 
const User = require('./models/User'); // Assuming this model is used/imported in authRoutes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev'; // Defined JWT_SECRET

// --- Middleware (Universal CORS FIX) ---

const ALLOWED_ORIGINS = [
    'https://mern-endterm.vercel.app',       
    'https://mern-endterm-czx9.vercel.app',
    'https://mern-endterm2.onrender.com', // Added Render Frontend URL from error log
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like Postman or direct link access)
        if (!origin) return callback(null, true);
        
        // Allow if the origin is explicitly listed OR if it matches a Vercel/Render preview URL
        if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
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

// --- Mongoose Schema and Model ---
// NOTE: User model must be defined in models/User.js if used in authRoutes, 
// but we define Expense here for simplicity as per previous code.

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
    // Updated success message for clarity
    res.send('Expense Tracker API is running - CORS FIX APPLIED.');
});


// NOTE: Assuming authRoutes is mounted under the root, 
// so the paths are handled correctly by the client calling /auth/login.
app.use('/auth', authRoutes);


// --- PROTECTED EXPENSE ROUTES ---
// NOTE: These routes are mounted directly under the root, 
// so client calls /expenses and /api/expenses (depending on client/vercel config)

app.get('/expenses', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); 
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


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
