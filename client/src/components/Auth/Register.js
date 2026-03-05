import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
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
        
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed');
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

            {/* Register Form Container */}
            <div className="auth-container">
                <div className="auth-card animate-slide-up">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-icon">
                            <span className="icon-pulse">✨</span>
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join CoreShift to save your transformations</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div className="input-group-animated">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control animated-input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

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
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                />
                            </div>
                            <small className="form-text">Minimum 6 characters</small>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-success btn-lg w-100 btn-pulse"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Creating account...
                                </>
                            ) : (
                                '🚀 Create Account'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Already have an account? 
                            <Link to="/login" className="auth-link"> Login</Link>
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
                        <span className="feature-icon">💾</span>
                        <span>Save Unlimited Projects</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>Access Transformation History</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">📥</span>
                        <span>Download All Reports</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;