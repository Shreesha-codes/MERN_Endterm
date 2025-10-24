import React, { useState, useEffect } from 'react';
import './App.css'; 

// !!! CRITICAL: Set the LIVE VERCEL DOMAIN for the API calls !!!
// The /api path is handled by the vercel.json rewrite rule in the root.
const API_BASE_URL = 'https://my-mern-api.onrender.com/api'; 

function App() {
    // State for Auth
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(null);
    const [isLoginView, setIsLoginView] = useState(true); // Toggle between Login/Register

    // State for Expenses
    const [expenses, setExpenses] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    
    // General State
    const [loading, setLoading] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [error, setError] = useState(null);

    // Check token on load and set user email
    useEffect(() => {
        if (token) {
            fetchExpenses(); 
            const savedEmail = localStorage.getItem('userEmail');
            if (savedEmail) {
                setUserEmail(savedEmail);
            }
        }
    }, [token]);

    // ----------------------------------------------------
    // AUTHENTICATION LOGIC
    // ----------------------------------------------------

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const endpoint = isLoginView ? '/auth/login' : '/auth/auth/register'; // Check for correct route endpoint on Vercel
        
        // Use the absolute URL for debugging Vercel routing
        const url = `${API_BASE_URL}${endpoint}`;


        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: authEmail, password: authPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                 // Check for 405 error explicitly in logs
                 console.error("API Response Status:", response.status); 
                throw new Error(data.message || (isLoginView ? 'Login failed. Check backend configuration.' : 'Registration failed.'));
            }

            // Success: Save token and user email
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.user.email || authEmail); 
            setToken(data.token);
            setUserEmail(data.user.email || authEmail);

            setAuthEmail('');
            setAuthPassword('');
            fetchExpenses(); 

        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUserEmail(null);
        setExpenses([]);
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail'); 
        setError(null);
    };

    // ----------------------------------------------------
    // EXPENSE LOGIC
    // ----------------------------------------------------

    const fetchExpenses = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/expenses`, {
                headers: {
                    'x-auth-token': token, 
                },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 400) {
                     handleLogout();
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch expenses.');
            }
            const data = await response.json();
            setExpenses(data);
        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        // Since alert() is restricted, console logging the error
        if (!description || !amount || isNaN(Number(amount))) {
             console.error('Validation Error: Please enter a valid description and amount.');
             setError('Please enter a valid description and amount.');
             return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, 
                },
                body: JSON.stringify({ description, amount }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add expense');
            }

            setDescription('');
            setAmount('');
            fetchExpenses();

        } catch (err) {
            setError(`Error submitting: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const total = expenses.reduce((acc, expense) => acc + expense.amount, 0);

    // ----------------------------------------------------
    // RENDER LOGIC
    // ----------------------------------------------------

    if (!token) {
        // Show Auth Forms
        return (
            <div className="App auth-container">
                <h1>MERN Expense Tracker 🔒</h1>
                <h2>{isLoginView ? 'Login' : 'Register'}</h2>
                
                {error && <p className="error">{error}</p>}

                <form onSubmit={handleAuth} className="auth-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (isLoginView ? 'Login' : 'Register')}
                    </button>
                </form>

                <p className="toggle-auth">
                    {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLoginView(!isLoginView)} className="link-button">
                        {isLoginView ? 'Register' : 'Login'}
                    </button>
                </p>
                
            </div>
        );
    }

    // Show Main App when logged in

    return (
        <div className="App">
            <div className="header-bar">
                <p>Logged in as: <strong>{userEmail}</strong></p>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
            
            <h1>My Expenses 📊</h1>
            
            {/* ADD EXPENSE FORM */}
            <div className="form-section">
                <h2>Add New Expense</h2>
                <form onSubmit={handleSubmitExpense}>
                    <input
                        type="text"
                        placeholder="Description (e.g., Coffee, Rent)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        step="0.01"
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </form>
            </div>

            {/* EXPENSE LIST */}
            <div className="list-section">
                <h2>Expense Summary</h2>
                {error && <p className="error">{error}</p>}
                
                {loading && expenses.length === 0 ? (
                    <p>Loading expenses...</p>
                ) : (
                    <>
                         {/* Display Total above the table for immediate visibility */}
                        <div className="total">
                            <strong>Total Expenses: ₹{total.toFixed(2)}</strong>
                        </div>

                        {expenses.length === 0 ? (
                            <p style={{marginTop: '20px', textAlign: 'center'}}>No expenses recorded yet. Add one above!</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th style={{textAlign: 'right'}}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense) => (
                                        <tr key={expense._id}>
                                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                                            <td>{expense.description}</td>
                                            <td className="amount-cell">₹{expense.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            <p className="footer">Only expenses belonging to **{userEmail}** are shown.</p>

        </div>
    );
}

export default App;