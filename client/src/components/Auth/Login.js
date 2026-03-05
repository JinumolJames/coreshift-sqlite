import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', formData);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* Animated Background */}
            <div className="auth-background"></div>
            
            {/* Floating Code Elements */}
            <div className="floating-elements">
                <div className="float-code code-1">{'<code>'}</div>
                <div className="float-code code-2">{'{ }'}</div>
                <div className="float-code code-3">{'[ ]'}</div>
                <div className="float-code code-4">{'</>'}</div>
                <div className="float-code code-5">{'=>'}</div>
            </div>

            {/* Navigation */}
            <nav className="auth-nav">
                <Link to="/" className="auth-logo">
                    🚀 CoreShift
                </Link>
                <div className="auth-nav-links">
                    <Link to="/try" className="btn btn-outline-light btn-sm">Try Demo</Link>
                    <Link to="/about" className="btn btn-light btn-sm">About</Link>
                </div>
            </nav>

            {/* Login Form Container */}
            <div className="auth-container">
                <div className="auth-card animate-slide-up">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-icon">
                            <span className="icon-pulse">🔐</span>
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Login to access your projects</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-group-animated">
                                <span className="input-icon">📧</span>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control animated-input"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-group-animated">
                                <span className="input-icon">🔑</span>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control animated-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-success btn-lg w-100 btn-pulse"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Logging in...
                                </>
                            ) : (
                                '🚀 Login'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Don't have an account? 
                            <Link to="/register" className="auth-link"> Create one</Link>
                        </p>
                        <p className="mt-2">
                            <Link to="/try" className="auth-link">
                                ✨ Try without account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Features Highlight */}
                <div className="auth-features animate-slide-up-delay">
                    <div className="feature-item">
                        <span className="feature-icon">⚡</span>
                        <span>AI-Powered Transformation</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">💾</span>
                        <span>Save Your Projects</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>View History</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;