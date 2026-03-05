import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectAPI } from '../../services/api';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await projectAPI.getAll();
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to load projects');
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
            toast.success('Project created successfully');
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
        toast.info('Logged out successfully');
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectAPI.delete(projectId);
                toast.success('Project deleted');
                loadProjects();
            } catch (error) {
                toast.error('Failed to delete project');
            }
        }
    };

    return (
        <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh' }}>
            <Navbar bg="success" variant="dark" className="mb-4">
                <Container>
                    <Navbar.Brand style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        CoreShift
                    </Navbar.Brand>
                    <div className="d-flex align-items-center">
                        <span className="text-white me-3">Welcome, {user.name}!</span>
                        <Button variant="light" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </Container>
            </Navbar>

            <Container className="py-4">
                <Row className="mb-4">
                    <Col>
                        <h2>My Projects</h2>
                    </Col>
                    <Col className="text-end">
                        <Button 
                            variant="success" 
                            size="lg"
                            onClick={() => setShowModal(true)}
                        >
                            + Create New Project
                        </Button>
                    </Col>
                </Row>

                <Row>
                    {projects.length === 0 ? (
                        <Col>
                            <Card className="text-center py-5">
                                <Card.Body>
                                    <h4 className="text-muted">No projects yet</h4>
                                    <p className="text-muted">Create your first code migration project!</p>
                                    <Button 
                                        variant="success" 
                                        onClick={() => setShowModal(true)}
                                    >
                                        Get Started
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ) : (
                        projects.map((project) => (
                            <Col key={project.project_id} md={4} className="mb-3">
                                <Card>
                                    <Card.Body>
                                        <Card.Title>{project.project_name}</Card.Title>
                                        <Card.Text>
                                            <span className={`badge bg-${project.status === 'completed' ? 'success' : project.status === 'failed' ? 'danger' : 'warning'}`}>
                                                {project.status}
                                            </span>
                                        </Card.Text>
                                        <Card.Text className="text-muted small">
                                            Created: {new Date(project.created_at).toLocaleDateString()}
                                        </Card.Text>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate(`/project/${project.project_id}`)}
                                            >
                                                Open
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => handleDeleteProject(project.project_id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    )}
                </Row>
            </Container>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Project Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g., Legacy System Migration"
                                autoFocus
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleCreateProject} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Project'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Dashboard;
