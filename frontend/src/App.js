

import React, { useState, useEffect } from 'react';
import './App.css'; 


const API_BASE_URL = 'https://mern-endterm1.onrender.com'; 

function App() {
    // State for Auth
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(null);
    const [isLoginView, setIsLoginView] = useState(true);

    // State for Expenses (Create/Edit Form)
    const [expenses, setExpenses] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); // Default to today
    
    // State for Editing Modal
    const [isEditing, setIsEditing] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null); // Holds the expense being edited

    // State for Filtering 
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterDay, setFilterDay] = useState('');

    // General State
    const [loading, setLoading] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [error, setError] = useState(null);

    // Load expenses/auth on mount or token/filter change
    useEffect(() => {
        if (token) {
            fetchExpenses(); 
            const savedEmail = localStorage.getItem('userEmail');
            if (savedEmail) {
                setUserEmail(savedEmail);
            }
        }
    }, [token, filterYear, filterMonth, filterDay]); 

    const handleLogout = () => {
        setToken(null);
        setUserEmail(null);
        setExpenses([]);
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail'); 
        setError(null);
    };

    // --- AUTHENTICATION LOGIC ---

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register'; 

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                credentials: 'include', 
                body: JSON.stringify({ email: authEmail, password: authPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || (isLoginView ? 'Login failed.' : 'Registration failed.'));
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.user.email || authEmail); 
            setToken(data.token);
            setUserEmail(data.user.email || authEmail);

            setAuthEmail('');
            setAuthPassword('');
            fetchExpenses(); 

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- EXPENSE LOGIC ---

    const fetchExpenses = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        
        // Dynamically construct URL with filter queries
        let queryParams = [];
        if (filterYear) queryParams.push(`year=${filterYear}`);
        if (filterMonth) queryParams.push(`month=${filterMonth}`);
        if (filterDay) queryParams.push(`day=${filterDay}`);
        
        const url = `${API_BASE_URL}/api/expenses` + (queryParams.length ? `?${queryParams.join('&')}` : '');
        
        try {
            const response = await fetch(url, {
                headers: { 'x-auth-token': token },
                credentials: 'include', 
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 400) { handleLogout(); }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch expenses.');
            }
            const data = await response.json();
            setExpenses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        if (!description || !amount || isNaN(Number(amount))) {
            console.error('Validation Error: Please enter a valid description and amount.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, 
                },
                credentials: 'include', 
                body: JSON.stringify({ description, amount, date }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add expense');
            }

            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().substring(0, 10)); // Reset date to today
            fetchExpenses();

        } catch (err) {
            setError(`Error submitting: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token, },
                credentials: 'include', 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete expense');
            }
            // Update UI optimistically
            setExpenses(expenses.filter(expense => expense._id !== id));
            
        } catch (err) {
            setError(`Error deleting: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (expense) => {
        setCurrentExpense({
            ...expense,
            date: new Date(expense.date).toISOString().substring(0, 10) 
        });
        setIsEditing(true);
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/${currentExpense._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token, 
                },
                credentials: 'include', 
                body: JSON.stringify({
                    description: currentExpense.description,
                    amount: currentExpense.amount,
                    date: currentExpense.date,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update expense');
            }

            setIsEditing(false);
            setCurrentExpense(null);
            fetchExpenses();

        } catch (err) {
            setError(`Error updating: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const total = expenses.reduce((acc, expense) => acc + expense.amount, 0);

    // ----------------------------------------------------
    // RENDER LOGIC 
    // ----------------------------------------------------

    if (!token) {
        // ... (Authentication UI)
        return (
            <div className="App auth-container">
                <h1>MERN Expense Tracker 🔒</h1>
                <h2>{isLoginView ? 'Login' : 'Register'}</h2>
                
                {error && <p className="error">{error}</p>}

                <form onSubmit={handleAuth} className="auth-form">
                    <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required />
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

    return (
        <div className="App">
            <div className="header-bar">
                <p>Logged in as: <strong>{userEmail}</strong></p>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
            
            <h1>My Expenses </h1>
            
            {/* ADD EXPENSE FORM */}
            <div className="form-section">
                <h2>Add New Expense</h2>
                <form onSubmit={handleSubmitExpense} className="expense-form">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={loading} />
                    <input type="text" placeholder="Description (e.g., Coffee, Rent)" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={loading} />
                    <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" disabled={loading} />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                </form>
            </div>
            
            {/* EXPENSE FILTERING UI */}
            <div className="filter-section">
                <h2>Filter Expenses</h2>
                <div className="filter-controls">
                    <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                        <option value="">All Years</option>
                        {[...Array(5).keys()].map(i => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} disabled={!filterYear}>
                        <option value="">All Months</option>
                        {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
                    </select>
                    <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} disabled={!filterMonth}>
                        <option value="">All Days</option>
                        {[...Array(31).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>
                    <button className="clear-filter" onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterDay(''); }}>Clear Filters</button>
                </div>
            </div>

            {/* EXPENSE LIST */}
            <div className="list-section">
                <h2>Expense Summary</h2>
                {error && <p className="error">{error}</p>}
                
                {loading && expenses.length === 0 ? (<p>Loading expenses...</p>) : (
                    <>
                        <div className="total">
                            <strong>Total Filtered Expenses: ₹{total.toFixed(2)}</strong>
                        </div>

                        {expenses.length === 0 ? (
                            <p style={{marginTop: '20px', textAlign: 'center'}}>No expenses recorded or no expenses match the filter criteria.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th style={{textAlign: 'right'}}>Amount (₹)</th>
                                        <th style={{textAlign: 'center'}}>Action</th> 
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense) => (
                                        <tr key={expense._id}>
                                            <td>{new Date(expense.date).toLocaleDateString()}</td>
                                            <td>{expense.description}</td>
                                            <td className="amount-cell">₹{expense.amount.toFixed(2)}</td>
                                            <td className="action-cell">
                                                <button onClick={() => openEditModal(expense)} className="edit-item-button" disabled={loading}>Edit</button>
                                                <button onClick={() => handleDeleteExpense(expense._id)} className="delete-item-button" disabled={loading}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            <p className="footer">Only expenses belonging to **{userEmail}** are shown.</p>
            
            {/* EDIT MODAL */}
            {isEditing && currentExpense && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Edit Expense</h3>
                        <form onSubmit={handleUpdateExpense} className="edit-form">
                            <label>Date:</label>
                            <input type="date" value={currentExpense.date} onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})} required />
                            <label>Description:</label>
                            <input type="text" value={currentExpense.description} onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})} required />
                            <label>Amount:</label>
                            <input type="number" value={currentExpense.amount} onChange={(e) => setCurrentExpense({...currentExpense, amount: e.target.value})} required step="0.01" />
                            <div className="modal-actions">
                                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="cancel-button" disabled={loading}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;