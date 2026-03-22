import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './LandingPage.css';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import ProjectView from './components/Projects/ProjectView';
import PrivateRoute from './components/PrivateRoute';

const MAX_GUEST_TRIES = 5;

// Guest Mode Component with Real API Integration
function GuestMode() {
    const [code, setCode] = React.useState('');
    const [sourceLanguage, setSourceLanguage] = React.useState('Unknown');
    const [targetLanguage, setTargetLanguage] = React.useState('python');
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [showSamples, setShowSamples] = React.useState(true);

    // 5-try limit
    const [triesLeft, setTriesLeft] = React.useState(() => {
        const used = parseInt(localStorage.getItem('guestTries') || '0');
        return MAX_GUEST_TRIES - used;
    });
    const [limitReached, setLimitReached] = React.useState(() => {
        const used = parseInt(localStorage.getItem('guestTries') || '0');
        return used >= MAX_GUEST_TRIES;
    });

    const sampleCodes = {
        factorial: `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int num = 5;
    int result = factorial(num);
    printf("Factorial of %d is %d\\n", num, result);
    return 0;
}`,
        fibonacci: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    int n = 10;
    for(int i = 0; i < n; i++) {
        printf("%d ", fibonacci(i));
    }
    return 0;
}`,
        array: `#include <stdio.h>

int main() {
    int arr[] = {5, 2, 8, 1, 9};
    int n = 5;
    
    // Find max
    int max = arr[0];
    for(int i = 1; i < n; i++) {
        if(arr[i] > max) {
            max = arr[i];
        }
    }
    
    printf("Maximum: %d\\n", max);
    return 0;
}`
    };

    const loadSample = (sample) => {
        setCode(sampleCodes[sample]);
        setShowSamples(false);
        setResult(null);
        setSourceLanguage('Unknown');
    };

    const handleTransform = async () => {
        if (!code.trim()) {
            toast.error('Please enter some code to transform!');
            return;
        }

        // Check try limit before calling API
        const used = parseInt(localStorage.getItem('guestTries') || '0');
        if (used >= MAX_GUEST_TRIES) {
            setLimitReached(true);
            setTriesLeft(0);
            return;
        }

        setLoading(true);
        try {
            let detectedLang = sourceLanguage;
            if (sourceLanguage === 'Unknown') {
                const detectResponse = await axios.post('http://localhost:5000/api/guest/detect-language', {
                    code: code
                });
                detectedLang = detectResponse.data.language;
                setSourceLanguage(detectedLang);
            }

            const response = await axios.post('http://localhost:5000/api/guest/transform', {
                code: code,
                sourceLanguage: detectedLang,
                targetLanguage: targetLanguage
            });

            // Increment try count only on success
            const newUsed = used + 1;
            localStorage.setItem('guestTries', newUsed.toString());
            const remaining = MAX_GUEST_TRIES - newUsed;
            setTriesLeft(remaining);
            if (remaining <= 0) setLimitReached(true);

            setResult({
                original: code,
                transformed: response.data.transformedCode,
                explanation: response.data.explanation,
            });

            toast.success('Code transformed successfully!');

        } catch (error) {
            console.error('Transformation error:', error);
            toast.error(error.response?.data?.error || 'Transformation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show limit reached wall
    if (limitReached) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    background: 'white', borderRadius: '24px', padding: '48px',
                    maxWidth: '480px', width: '90%', textAlign: 'center',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔒</div>
                    <h2 style={{ color: '#333', fontWeight: '800', marginBottom: '12px' }}>
                        You've used all 5 free tries!
                    </h2>
                    <p style={{ color: '#666', marginBottom: '8px', lineHeight: '1.6' }}>
                        Create a <strong>free account</strong> to get unlimited migrations,
                        save your projects, and download results.
                    </p>
                    <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '32px' }}>
                        It only takes 30 seconds to sign up.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/register" style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white', padding: '14px 32px', borderRadius: '12px',
                            textDecoration: 'none', fontWeight: '600', fontSize: '1rem',
                            boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
                        }}>
                            🚀 Create Free Account
                        </a>
                        <a href="/login" style={{
                            background: 'transparent', color: '#667eea',
                            padding: '14px 24px', borderRadius: '12px',
                            textDecoration: 'none', fontWeight: '500',
                            border: '2px solid #667eea'
                        }}>
                            Login
                        </a>
                    </div>
                    <p style={{ color: '#bbb', fontSize: '0.78rem', marginTop: '24px' }}>
                        Already have an account? <a href="/login" style={{ color: '#667eea' }}>Log in</a> to continue.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <nav className="navbar navbar-dark bg-primary shadow">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        🚀 CoreShift
                    </a>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Try counter badge */}
                        <span style={{
                            background: triesLeft <= 2 ? 'rgba(255,80,80,0.25)' : 'rgba(255,255,255,0.15)',
                            border: triesLeft <= 2 ? '1px solid rgba(255,80,80,0.5)' : '1px solid rgba(255,255,255,0.3)',
                            color: 'white', padding: '5px 12px', borderRadius: '20px',
                            fontSize: '0.82rem', fontWeight: '500'
                        }}>
                            {triesLeft <= 2 ? '⚠️' : '✨'} {triesLeft} free {triesLeft === 1 ? 'try' : 'tries'} left
                        </span>
                        <a href="/register" className="btn btn-success btn-sm">Sign Up Free</a>
                        <a href="/login" className="btn btn-outline-light btn-sm">Login</a>
                    </div>
                </div>
            </nav>

            <div className="container py-5">
                {showSamples ? (
                    <div className="text-center mb-5">
                        <h1 className="display-4 fw-bold mb-3" style={{color: '#667eea'}}>
                            Try CoreShift Free
                        </h1>
                        <p className="lead text-muted mb-2">
                            Choose a sample code below to see real AI transformation in action
                        </p>
                        <p className="text-muted mb-5" style={{ fontSize: '0.9rem' }}>
                            ✨ <strong>{triesLeft} free {triesLeft === 1 ? 'transformation' : 'transformations'}</strong> remaining
                            {' '}— <a href="/register">sign up</a> for unlimited access
                        </p>

                        <div className="row mb-4">
                            <div className="col-md-4 mb-3">
                                <div className="card shadow-sm h-100 sample-card" onClick={() => loadSample('factorial')}>
                                    <div className="card-body">
                                        <h4>🔢 Factorial Calculator</h4>
                                        <p className="text-muted">Recursive function to calculate factorial</p>
                                        <button className="btn btn-primary">Try This Sample</button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card shadow-sm h-100 sample-card" onClick={() => loadSample('fibonacci')}>
                                    <div className="card-body">
                                        <h4>📊 Fibonacci Series</h4>
                                        <p className="text-muted">Generate Fibonacci sequence</p>
                                        <button className="btn btn-primary">Try This Sample</button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card shadow-sm h-100 sample-card" onClick={() => loadSample('array')}>
                                    <div className="card-body">
                                        <h4>🎯 Array Maximum</h4>
                                        <p className="text-muted">Find maximum value in array</p>
                                        <button className="btn btn-primary">Try This Sample</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="btn btn-outline-primary btn-lg"
                                onClick={() => setShowSamples(false)}
                            >
                                Or Paste Your Own Code →
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <h2 style={{color: '#667eea'}}>Transform Your Code</h2>
                            <p className="text-muted">
                                Using real AI (Groq Llama 3.3) •{' '}
                                <span style={{ color: triesLeft <= 2 ? '#dc3545' : '#666' }}>
                                    <strong>{triesLeft}</strong> free {triesLeft === 1 ? 'try' : 'tries'} remaining
                                </span>
                                {' '}• <a href="/register">Sign up for unlimited</a>
                            </p>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <div className="card shadow">
                                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">📝 Your Code</h5>
                                        {sourceLanguage !== 'Unknown' && (
                                            <span className="badge bg-light text-dark">
                                                Detected: {sourceLanguage}
                                            </span>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <textarea
                                            className="form-control"
                                            rows="15"
                                            value={code}
                                            onChange={(e) => {
                                                setCode(e.target.value);
                                                setSourceLanguage('Unknown');
                                                setResult(null);
                                            }}
                                            placeholder="Paste your C, C++, or Java code here..."
                                            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                        />
                                        <button
                                            className="btn btn-link mt-2"
                                            onClick={() => {
                                                setShowSamples(true);
                                                setCode('');
                                                setResult(null);
                                                setSourceLanguage('Unknown');
                                            }}
                                        >
                                            ← Back to Samples
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 mb-4">
                                <div className="card shadow">
                                    <div className="card-header bg-success text-white">
                                        <h5 className="mb-0">✨ Transformed Code ({targetLanguage})</h5>
                                    </div>
                                    <div className="card-body">
                                        {result ? (
                                            <>
                                                <textarea
                                                    className="form-control"
                                                    rows="15"
                                                    value={result.transformed}
                                                    readOnly
                                                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                                />
                                                {/* Sign up prompt instead of download buttons */}
                                                <div style={{
                                                    marginTop: '16px', padding: '16px',
                                                    background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                                                    border: '1px solid #667eea44',
                                                    borderRadius: '12px', textAlign: 'center'
                                                }}>
                                                    <p style={{ color: '#555', marginBottom: '10px', fontSize: '0.9rem' }}>
                                                        💾 Want to <strong>save, download, and manage</strong> your migrations?
                                                    </p>
                                                    <a href="/register" className="btn btn-primary btn-sm me-2">
                                                        🚀 Create Free Account
                                                    </a>
                                                    <a href="/login" className="btn btn-outline-secondary btn-sm">
                                                        Login
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-muted" style={{ paddingTop: '100px' }}>
                                                <p className="h5">Your transformed code will appear here</p>
                                                <p className="small mt-3">
                                                    1. Select target language below<br/>
                                                    2. Click "🚀 Transform Code"<br/>
                                                    3. Wait 10-20 seconds for AI magic ✨
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card shadow mb-4">
                            <div className="card-body">
                                <div className="row align-items-center">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Target Language:</label>
                                        <select
                                            className="form-select"
                                            value={targetLanguage}
                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                        >
                                            <option value="python">Python 🐍</option>
                                            <option value="javascript">JavaScript 📜</option>
                                            <option value="typescript">TypeScript 📘</option>
                                            <option value="java">Java ☕</option>
                                            <option value="go">Go 🔷</option>
                                            <option value="rust">Rust 🦀</option>
                                            <option value="csharp">C# 💎</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 text-end">
                                        <button
                                            className="btn btn-success btn-lg pulse-button"
                                            onClick={handleTransform}
                                            disabled={loading || !code.trim()}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Transforming...
                                                </>
                                            ) : (
                                                `🚀 Transform Code (${triesLeft} left)`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warning when tries are low */}
                        {triesLeft <= 2 && (
                            <div className="alert alert-danger text-center">
                                <strong>⚠️ Only {triesLeft} free {triesLeft === 1 ? 'try' : 'tries'} remaining!</strong>{' '}
                                <a href="/register" className="alert-link">Create a free account</a> for unlimited migrations.
                            </div>
                        )}

                        <div className="alert alert-warning text-center">
                            <strong>💡 Guest Mode:</strong> Transformations are not saved.{' '}
                            <a href="/register" className="alert-link">Create a free account</a>{' '}
                            to save, download and manage your projects!
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Landing Page
function LandingPage() {
    return (
        <div className="landing-wrapper">
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <div className="logo">CoreShift</div>
                        <div className="nav-links">
                            <a href="/about">About</a>
                            <a href="/how-it-works">How It Works</a>
                            <a href="/try">Try Now</a>
                            <a href="/login" className="btn btn-outline-light btn-sm">Login</a>
                            <a href="/register" className="btn btn-success btn-sm">Sign Up</a>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="hero-section">
                <div className="container">
                    <div className="row align-items-center min-vh-100">
                        <div className="col-lg-6 hero-content">
                            <div className="brand-badge animate-fade-in">
                                <span className="badge-icon">🚀</span>
                                <span>AI-Powered Migration</span>
                            </div>
                            <h1 className="hero-brand animate-fade-in">CoreShift</h1>
                            <h2 className="hero-title animate-fade-in-delay">
                                Transform Your Legacy Code with AI
                            </h2>
                            <p className="hero-subtitle animate-fade-in-delay-2">
                                Automatically migrate code from C, C++, Java to modern languages 
                                like Python, JavaScript, and more. Try instantly - no signup required!
                            </p>
                            <div className="hero-buttons animate-fade-in-delay-3">
                                <a href="/try" className="btn btn-success btn-lg me-3 pulse-button">
                                    🎯 Try Now - Free
                                </a>
                                <a href="/about" className="btn btn-outline-light btn-lg">
                                    Learn More →
                                </a>
                            </div>
                            <p className="hero-note animate-fade-in-delay-3">
                                ✨ No signup needed • ⚡ Real AI transformations • 💾 Optional account to save
                            </p>
                        </div>
                        <div className="col-lg-6 text-center">
                            <div className="code-demo animate-float">
                                <div className="code-box">
                                    <div className="code-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="code-label">Legacy C</div>
                                    <div className="code-content">
                                        <pre>{`#include <stdio.h>

int main() {
    printf("Hello");
    return 0;
}`}</pre>
                                    </div>
                                </div>
                                <div className="arrow-animation">→</div>
                                <div className="code-box modern">
                                    <div className="code-header">
                                        <span className="dot red"></span>
                                        <span className="dot yellow"></span>
                                        <span className="dot green"></span>
                                    </div>
                                    <div className="code-label">Modern Python</div>
                                    <div className="code-content">
                                        <pre>{`def main():
    print("Hello")

if __name__ == "__main__":
    main()`}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h2 className="section-title">Why Choose CoreShift?</h2>
                        <p className="section-subtitle">Powerful features for seamless code migration</p>
                    </div>
                    <div className="row">
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">🤖</div>
                                <h4>AI-Powered</h4>
                                <p>Advanced AI understands code context and preserves logic</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">⚡</div>
                                <h4>Lightning Fast</h4>
                                <p>Transform code in seconds, not days</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">🎯</div>
                                <h4>Try Without Signup</h4>
                                <p>Test instantly with sample codes, no account needed</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">📊</div>
                                <h4>Side-by-Side View</h4>
                                <p>Compare original and transformed code easily</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">🔒</div>
                                <h4>Secure & Private</h4>
                                <p>Your code is safe and never stored without permission</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4">
                            <div className="feature-card">
                                <div className="feature-icon">💾</div>
                                <h4>Optional Accounts</h4>
                                <p>Try free, signup only when you want to save</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="container py-5 text-white text-center">
                    <h2 className="mb-5">Trusted by Developers Worldwide</h2>
                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <div className="stat-box">
                                <h2 className="stat-number">8+</h2>
                                <p>Programming Languages</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="stat-box">
                                <h2 className="stat-number">95%</h2>
                                <p>Transformation Accuracy</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="stat-box">
                                <h2 className="stat-number">10s</h2>
                                <p>Average Processing Time</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="stat-box">
                                <h2 className="stat-number">Free</h2>
                                <p>Try Without Limits</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container py-5 text-center">
                    <h2 className="mb-4">Ready to Transform Your Code?</h2>
                    <p className="lead mb-4">
                        Start transforming instantly - try with samples or paste your own code
                    </p>
                    <div className="cta-buttons">
                        <a href="/try" className="btn btn-success btn-lg me-3 pulse-button">
                            Try Now - Free
                        </a>
                        <a href="/register" className="btn btn-primary btn-lg">
                            Create Account (Optional)
                        </a>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="container py-4 text-center text-white">
                    <p className="mb-0">© 2025 CoreShift - AI-Powered Code Migration Platform</p>
                </div>
            </footer>
        </div>
    );
}

// About Page
function AboutPage() {
    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <nav className="navbar navbar-dark bg-primary mb-0 shadow">
                <div className="container">
                    <a className="navbar-brand" href="/" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        🚀 CoreShift
                    </a>
                    <div>
                        <a href="/try" className="btn btn-success btn-sm me-2">Try Now</a>
                        <a href="/" className="btn btn-light btn-sm">← Back to Home</a>
                    </div>
                </div>
            </nav>

            <div className="container py-5">
                <div className="text-center mb-5">
                    <div className="about-icon mb-3">🎯</div>
                    <h1 className="display-3 fw-bold mb-3" style={{color: '#667eea'}}>About CoreShift</h1>
                    <p className="lead" style={{color: '#555'}}>
                        The AI-powered platform revolutionizing code migration
                    </p>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <h2 className="mb-4 text-primary">🚀 Our Mission</h2>
                                <p className="lead" style={{color: '#333'}}>
                                    CoreShift exists to eliminate the pain of legacy code migration. 
                                    We believe that modernizing codebases shouldn't require months 
                                    of manual rewriting and debugging.
                                </p>
                                <p style={{color: '#555'}}>
                                    By leveraging cutting-edge artificial intelligence, we've created 
                                    a platform that understands code like a human developer - but works 
                                    at machine speed. Whether you're migrating a small utility or an 
                                    entire application, CoreShift makes it fast, accurate, and painless.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                            <div className="card-body p-5 text-white">
                                <h2 className="mb-4">💡 What We Do</h2>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <h5>🔍 Intelligent Analysis</h5>
                                        <p>Our AI analyzes your code's structure, patterns, and logic flow</p>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <h5>🎯 Accurate Transformation</h5>
                                        <p>Preserve functionality while adapting to target language idioms</p>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <h5>📊 Clear Comparisons</h5>
                                        <p>See exactly what changed and why with side-by-side views</p>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <h5>⚡ Instant Results</h5>
                                        <p>Get transformed code in seconds, not hours or days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <h2 className="mb-4 text-primary">🛠️ Our Technology</h2>
                                <p className="mb-4" style={{color: '#555'}}>
                                    CoreShift is built on a modern, scalable architecture designed for 
                                    speed, reliability, and accuracy.
                                </p>
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="text-success mb-3">🎨 Frontend Technologies</h5>
                                        <ul className="tech-list" style={{color: '#555'}}>
                                            <li><strong>React 18</strong> - Modern UI framework</li>
                                            <li><strong>Bootstrap 5</strong> - Responsive design system</li>
                                            <li><strong>Axios</strong> - HTTP client for API calls</li>
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <h5 className="text-success mb-3">⚙️ Backend Technologies</h5>
                                        <ul className="tech-list" style={{color: '#555'}}>
                                            <li><strong>Node.js & Express</strong> - Scalable server</li>
                                            <li><strong>SQLite</strong> - Efficient data storage</li>
                                            <li><strong>JWT</strong> - Secure authentication</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-white rounded border">
                                    <h5 className="text-primary mb-3">🤖 AI Engine</h5>
                                    <p className="mb-0" style={{color: '#555'}}>
                                        Powered by <strong>Groq's Llama 3.3 70B</strong> - One of the most 
                                        advanced large language models optimized for code understanding 
                                        and generation. Fast, accurate, and constantly improving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <h2 className="mb-4 text-primary">🌐 Supported Languages</h2>
                                <p className="mb-4" style={{color: '#555'}}>
                                    Transform code between multiple programming languages seamlessly
                                </p>
                                <div className="row text-center g-3">
                                    {['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust'].map(lang => (
                                        <div key={lang} className="col-6 col-md-3">
                                            <div className="language-badge">
                                                {lang}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="mb-4" style={{color: '#333'}}>Experience the Future of Code Migration</h3>
                    <div>
                        <a href="/try" className="btn btn-success btn-lg me-3">Try Now - Free</a>
                        <a href="/register" className="btn btn-primary btn-lg">Create Account</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// How It Works Page
function HowItWorksPage() {
    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <nav className="navbar navbar-dark bg-primary mb-0 shadow">
                <div className="container">
                    <a className="navbar-brand" href="/" style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        🚀 CoreShift
                    </a>
                    <div>
                        <a href="/try" className="btn btn-success btn-sm me-2">Try Now</a>
                        <a href="/" className="btn btn-light btn-sm">← Back to Home</a>
                    </div>
                </div>
            </nav>

            <div className="container py-5">
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold mb-3" style={{color: '#667eea'}}>How It Works</h1>
                    <p className="lead" style={{color: '#555'}}>Transform your code in 3 simple steps</p>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <div className="d-flex align-items-center mb-4">
                                    <div className="step-number">1</div>
                                    <div className="ms-4">
                                        <h2 className="mb-2" style={{color: '#333'}}>Try Instantly</h2>
                                        <p className="text-muted mb-0">No signup required to start</p>
                                    </div>
                                </div>
                                <ul style={{color: '#555'}}>
                                    <li>Click <strong>"Try Now"</strong> on homepage</li>
                                    <li>Choose from <strong>sample codes</strong> to see how it works</li>
                                    <li>Or paste your own C, C++, or Java code</li>
                                    <li>No account needed for first 5 tries!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <div className="d-flex align-items-center mb-4">
                                    <div className="step-number">2</div>
                                    <div className="ms-4">
                                        <h2 className="mb-2" style={{color: '#333'}}>Select Target Language</h2>
                                        <p className="text-muted mb-0">Choose where to transform</p>
                                    </div>
                                </div>
                                <ul style={{color: '#555'}}>
                                    <li>Select target language (Python, JavaScript, etc.)</li>
                                    <li>AI automatically detects your source language</li>
                                    <li>Click <strong>"🚀 Transform Code"</strong></li>
                                    <li>Wait 10-20 seconds for AI processing</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row mb-5">
                    <div className="col-lg-10 mx-auto">
                        <div className="card shadow-lg border-0" style={{backgroundColor: '#f8f9fa'}}>
                            <div className="card-body p-5">
                                <div className="d-flex align-items-center mb-4">
                                    <div className="step-number">3</div>
                                    <div className="ms-4">
                                        <h2 className="mb-2" style={{color: '#333'}}>Get Results & Save (Optional)</h2>
                                        <p className="text-muted mb-0">View, download, or save</p>
                                    </div>
                                </div>
                                <ul style={{color: '#555'}}>
                                    <li>View <strong>side-by-side comparison</strong> of original and transformed code</li>
                                    <li>Copy transformed code instantly</li>
                                    <li><strong>Want to save?</strong> Create a free account</li>
                                    <li>With account: Save projects, view history, download reports</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="mb-4" style={{color: '#333'}}>Ready to Transform Your Code?</h3>
                    <a href="/try" className="btn btn-success btn-lg me-3">Try Now - No Signup</a>
                    <a href="/register" className="btn btn-primary btn-lg">Create Account (Optional)</a>
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/try" element={<GuestMode />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/project/:id"
                    element={
                        <PrivateRoute>
                            <ProjectView />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;