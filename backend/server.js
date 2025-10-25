

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
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


//  Mongoose Schema and Model (Expense) 
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
app.use('/api/auth', authRoutes);


// --- Protected Expense Routes (CRUD & FILTERING) ---

// GET all expenses for the LOGGED-IN user with optional date filters (READ & FILTER)
app.get('/api/expenses', auth, async (req, res) => {
    try {
        const { year, month, day } = req.query;
        const filter = { user: req.user.id };

        // CONSTRUCTING THE DYNAMIC DATE FILTER
        if (year || month || day) {
            let startDate, endDate;
            
            if (year && month && day) {
                // Day-wise filter
                startDate = new Date(year, month - 1, day);
                endDate = new Date(year, month - 1, Number(day) + 1);
            } else if (year && month) {
                // Month-wise filter
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 1);
            } else if (year) {
                // Year-wise filter
                startDate = new Date(year, 0, 1);
                endDate = new Date(Number(year) + 1, 0, 1);
            }

            if (startDate && endDate) {
                filter.date = { $gte: startDate, $lt: endDate };
            }
        }

        const expenses = await Expense.find(filter).sort({ date: -1 }); 
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Filtering error:", error);
        res.status(500).json({ message: error.message });
    }
});

// POST a new expense for the LOGGED-IN user (CREATE)
app.post('/api/expenses', auth, async (req, res) => {
    const { description, amount, date } = req.body; 
    if (!description || !amount) {
        return res.status(400).json({ message: 'Description and amount are required.' });
    }
    const newExpense = new Expense({ 
        user: req.user.id,
        description, 
        amount: Number(amount),
        date: date ? new Date(date) : new Date(), // Use provided date or current date
    });
    try {
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// PATCH/PUT to update an expense by ID (UPDATE)
app.patch('/api/expenses/:id', auth, async (req, res) => {
    const { description, amount, date } = req.body;
    try {
        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id }, // Find by ID and ensure ownership
            { 
                $set: { 
                    description, 
                    amount: Number(amount), 
                    date: date ? new Date(date) : undefined 
                } 
            },
            { new: true } // Return the updated document
        );

        if (!updatedExpense) {
            return res.status(404).json({ message: 'Expense not found or unauthorized.' });
        }

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// DELETE an expense by ID
app.delete('/api/expenses/:id', auth, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ 
            _id: req.params.id, 
            user: req.user.id // Ensure only the owner can delete it
        });

        if (!expense) {
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