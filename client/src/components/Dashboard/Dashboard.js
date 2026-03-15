import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectAPI } from '../../services/api';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadProjects();
        setTimeout(() => setPageLoaded(true), 100);
    }, []);

    const loadProjects = async () => {
        setProjectsLoading(true);
        try {
            const response = await projectAPI.getAll();
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to load projects');
        } finally {
            setProjectsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast.error('Please enter a project name');
            return;
        }
        setLoading(true);
        try {
            await projectAPI.create({ project_name: newProjectName });
            toast.success('Project created!');
            setShowModal(false);
            setNewProjectName('');
            loadProjects();
        } catch (error) {
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        toast.info('Logged out');
    };

    const handleDeleteProject = async (projectId, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this project?')) {
            try {
                await projectAPI.delete(projectId);
                toast.success('Project deleted');
                loadProjects();
            } catch (error) {
                toast.error('Failed to delete project');
            }
        }
    };

    const filteredProjects = projects.filter(p =>
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: projects.length,
        completed: projects.filter(p => p.status === 'completed').length,
        pending: projects.filter(p => p.status === 'pending').length,
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return '#10b981';
        if (status === 'failed') return '#ef4444';
        return '#f59e0b';
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return '✓';
        if (status === 'failed') return '✕';
        return '⏳';
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .dash-root {
                    min-height: 100vh;
                    background: #0a0a0f;
                    font-family: 'DM Sans', sans-serif;
                    color: #e2e8f0;
                    position: relative;
                    overflow-x: hidden;
                }

                /* Animated background */
                .dash-root::before {
                    content: '';
                    position: fixed;
                    top: -40%;
                    left: -20%;
                    width: 700px;
                    height: 700px;
                    background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
                    animation: bgFloat 8s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 0;
                }
                .dash-root::after {
                    content: '';
                    position: fixed;
                    bottom: -30%;
                    right: -10%;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
                    animation: bgFloat 10s ease-in-out infinite reverse;
                    pointer-events: none;
                    z-index: 0;
                }
                @keyframes bgFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -30px); }
                }

                /* Navbar */
                .dash-nav {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: rgba(10,10,15,0.8);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    padding: 0 40px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .dash-logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.4rem;
                    background: linear-gradient(135deg, #a78bfa, #60a5fa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: -0.5px;
                }
                .dash-nav-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .dash-welcome {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.45);
                    font-weight: 300;
                }
                .dash-welcome span {
                    color: rgba(255,255,255,0.8);
                    font-weight: 500;
                }
                .btn-logout {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6);
                    padding: 7px 16px;
                    border-radius: 8px;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .btn-logout:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                /* Main content */
                .dash-content {
                    position: relative;
                    z-index: 1;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 48px 40px;
                }

                /* Header section */
                .dash-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease;
                }
                .dash-header.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .dash-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: white;
                    letter-spacing: -1px;
                    line-height: 1;
                }
                .dash-title span {
                    background: linear-gradient(135deg, #a78bfa, #60a5fa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .dash-subtitle {
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.35);
                    margin-top: 6px;
                    font-weight: 300;
                }
                .btn-new-project {
                    background: linear-gradient(135deg, #7c3aed, #3b82f6);
                    border: none;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                    font-family: 'DM Sans', sans-serif;
                    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
                    white-space: nowrap;
                }
                .btn-new-project:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(124,58,237,0.5);
                }
                .btn-new-project:active { transform: translateY(0); }

                /* Stats row */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 36px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease 0.15s;
                }
                .stats-row.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .stat-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.3s;
                }
                .stat-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(167,139,250,0.2);
                    transform: translateY(-2px);
                }
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .stat-icon.purple { background: rgba(124,58,237,0.15); }
                .stat-icon.green { background: rgba(16,185,129,0.15); }
                .stat-icon.amber { background: rgba(245,158,11,0.15); }
                .stat-num {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: white;
                    line-height: 1;
                }
                .stat-label {
                    font-size: 0.78rem;
                    color: rgba(255,255,255,0.35);
                    margin-top: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                /* Search bar */
                .search-wrap {
                    margin-bottom: 28px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.6s ease 0.25s;
                }
                .search-wrap.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .search-input {
                    width: 100%;
                    max-width: 360px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 10px;
                    padding: 10px 16px 10px 40px;
                    color: white;
                    font-size: 0.88rem;
                    font-family: 'DM Sans', sans-serif;
                    transition: all 0.2s;
                    outline: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23ffffff40' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: 14px center;
                }
                .search-input::placeholder { color: rgba(255,255,255,0.25); }
                .search-input:focus {
                    border-color: rgba(167,139,250,0.4);
                    background-color: rgba(255,255,255,0.06);
                }

                /* Projects grid */
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                }

                /* Project card */
                .project-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                    opacity: 0;
                    transform: translateY(30px);
                    position: relative;
                    overflow: hidden;
                }
                .project-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #7c3aed, #3b82f6);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .project-card:hover::before { opacity: 1; }
                .project-card.card-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .project-card:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(167,139,250,0.25);
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }
                .card-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2));
                    border: 1px solid rgba(167,139,250,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                }
                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.72rem;
                    font-weight: 500;
                    letter-spacing: 0.3px;
                }
                .project-name {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 6px;
                    letter-spacing: -0.3px;
                }
                .project-date {
                    font-size: 0.78rem;
                    color: rgba(255,255,255,0.25);
                    margin-bottom: 20px;
                }

                .card-actions {
                    display: flex;
                    gap: 10px;
                }
                .btn-open {
                    flex: 1;
                    background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25));
                    border: 1px solid rgba(167,139,250,0.3);
                    color: #c4b5fd;
                    padding: 9px 16px;
                    border-radius: 10px;
                    font-size: 0.84rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .btn-open:hover {
                    background: linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.4));
                    border-color: rgba(167,139,250,0.5);
                    color: white;
                }
                .btn-delete {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.15);
                    color: rgba(239,68,68,0.6);
                    padding: 9px 14px;
                    border-radius: 10px;
                    font-size: 0.84rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: 'DM Sans', sans-serif;
                }
                .btn-delete:hover {
                    background: rgba(239,68,68,0.15);
                    border-color: rgba(239,68,68,0.35);
                    color: #ef4444;
                }

                /* Empty state */
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 80px 40px;
                    opacity: 0;
                    animation: fadeIn 0.6s ease 0.3s forwards;
                }
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
                .empty-icon {
                    font-size: 3.5rem;
                    margin-bottom: 16px;
                    opacity: 0.4;
                }
                .empty-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 8px;
                }
                .empty-sub {
                    font-size: 0.88rem;
                    color: rgba(255,255,255,0.25);
                    margin-bottom: 28px;
                }
                .btn-empty-create {
                    background: linear-gradient(135deg, #7c3aed, #3b82f6);
                    border: none;
                    color: white;
                    padding: 12px 28px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: all 0.3s;
                    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
                }
                .btn-empty-create:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(124,58,237,0.5);
                }

                /* Skeleton loader */
                .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 20px; }
                .skeleton-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 24px; }
                .skeleton-line { background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

                /* Modal overlay */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(8px);
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: overlayIn 0.2s ease;
                }
                @keyframes overlayIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .modal-box {
                    background: #13131a;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 36px;
                    width: 100%;
                    max-width: 440px;
                    animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 6px;
                }
                .modal-sub {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 28px;
                }
                .modal-label {
                    font-size: 0.82rem;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .modal-input {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 13px 16px;
                    color: white;
                    font-size: 0.95rem;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: all 0.2s;
                    margin-bottom: 24px;
                }
                .modal-input::placeholder { color: rgba(255,255,255,0.2); }
                .modal-input:focus {
                    border-color: rgba(167,139,250,0.5);
                    background: rgba(255,255,255,0.07);
                    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                }
                .btn-cancel {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.5);
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: all 0.2s;
                }
                .btn-cancel:hover {
                    background: rgba(255,255,255,0.08);
                    color: white;
                }
                .btn-create {
                    flex: 2;
                    background: linear-gradient(135deg, #7c3aed, #3b82f6);
                    border: none;
                    color: white;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(124,58,237,0.3);
                }
                .btn-create:hover:not(:disabled) {
                    box-shadow: 0 6px 25px rgba(124,58,237,0.5);
                    transform: translateY(-1px);
                }
                .btn-create:disabled { opacity: 0.6; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .dash-content { padding: 32px 20px; }
                    .dash-nav { padding: 0 20px; }
                    .dash-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .stats-row { grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .stat-card { padding: 14px; }
                    .stat-num { font-size: 1.4rem; }
                }
            `}</style>

            <div className="dash-root">
                {/* Navbar */}
                <nav className="dash-nav">
                    <div className="dash-logo">CoreShift</div>
                    <div className="dash-nav-right">
                        <span className="dash-welcome">
                            Hey, <span>{user.name || 'there'}</span> 👋
                        </span>
                        <button className="btn-logout" onClick={handleLogout}>
                            Sign out
                        </button>
                    </div>
                </nav>

                <div className="dash-content">
                    {/* Header */}
                    <div className={`dash-header ${pageLoaded ? 'visible' : ''}`}>
                        <div>
                            <h1 className="dash-title">My <span>Projects</span></h1>
                            <p className="dash-subtitle">Manage your code migration projects</p>
                        </div>
                        <button className="btn-new-project" onClick={() => setShowModal(true)}>
                            <span style={{ fontSize: '1.1rem' }}>+</span>
                            New Project
                        </button>
                    </div>

                    {/* Stats */}
                    <div className={`stats-row ${pageLoaded ? 'visible' : ''}`}>
                        <div className="stat-card">
                            <div className="stat-icon purple">🗂️</div>
                            <div>
                                <div className="stat-num">{stats.total}</div>
                                <div className="stat-label">Total Projects</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">✅</div>
                            <div>
                                <div className="stat-num">{stats.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon amber">⏳</div>
                            <div>
                                <div className="stat-num">{stats.pending}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    {projects.length > 0 && (
                        <div className={`search-wrap ${pageLoaded ? 'visible' : ''}`}>
                            <input
                                className="search-input"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Projects Grid */}
                    {projectsLoading ? (
                        <div className="skeleton-grid">
                            {[1,2,3].map(i => (
                                <div key={i} className="skeleton-card">
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                                        <div className="skeleton-line" style={{ width:42, height:42, borderRadius:12 }}></div>
                                        <div className="skeleton-line" style={{ width:80, height:26, borderRadius:20 }}></div>
                                    </div>
                                    <div className="skeleton-line" style={{ width:'60%', height:18, marginBottom:10 }}></div>
                                    <div className="skeleton-line" style={{ width:'40%', height:14, marginBottom:24 }}></div>
                                    <div style={{ display:'flex', gap:10 }}>
                                        <div className="skeleton-line" style={{ flex:1, height:36, borderRadius:10 }}></div>
                                        <div className="skeleton-line" style={{ width:44, height:36, borderRadius:10 }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {filteredProjects.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🚀</div>
                                    <div className="empty-title">
                                        {searchQuery ? 'No projects found' : 'No projects yet'}
                                    </div>
                                    <p className="empty-sub">
                                        {searchQuery
                                            ? `No results for "${searchQuery}"`
                                            : 'Create your first code migration project to get started'}
                                    </p>
                                    {!searchQuery && (
                                        <button className="btn-empty-create" onClick={() => setShowModal(true)}>
                                            + Create First Project
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredProjects.map((project, index) => (
                                    <ProjectCard
                                        key={project.project_id}
                                        project={project}
                                        index={index}
                                        onOpen={() => navigate(`/project/${project.project_id}`)}
                                        onDelete={(e) => handleDeleteProject(project.project_id, e)}
                                        getStatusColor={getStatusColor}
                                        getStatusIcon={getStatusIcon}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-title">New Project</div>
                        <div className="modal-sub">Give your migration project a name</div>
                        <div className="modal-label">Project Name</div>
                        <input
                            className="modal-input"
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., Legacy C to Python"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-create" onClick={handleCreateProject} disabled={loading}>
                                {loading ? 'Creating...' : '✦ Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Separate card component for staggered animation
function ProjectCard({ project, index, onOpen, onDelete, getStatusColor, getStatusIcon }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), index * 80 + 300);
        return () => clearTimeout(timer);
    }, [index]);

    const statusColor = getStatusColor(project.status);

    return (
        <div
            className={`project-card ${visible ? 'card-visible' : ''}`}
            onClick={onOpen}
            style={{ transitionDelay: `${index * 0.05}s` }}
        >
            <div className="card-top">
                <div className="card-icon">⚡</div>
                <div
                    className="status-badge"
                    style={{
                        background: `${statusColor}18`,
                        border: `1px solid ${statusColor}35`,
                        color: statusColor,
                    }}
                >
                    <span>{getStatusIcon(project.status)}</span>
                    {project.status}
                </div>
            </div>

            <div className="project-name">{project.project_name}</div>
            <div className="project-date">
                Created {new Date(project.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                })}
            </div>

            <div className="card-actions">
                <button className="btn-open" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                    Open Project →
                </button>
                <button className="btn-delete" onClick={onDelete}>
                    🗑
                </button>
            </div>
        </div>
    );
}

export default Dashboard;