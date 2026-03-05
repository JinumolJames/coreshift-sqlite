import React from 'react';
import { Container, Row, Col, Card, Button, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function AboutPage() {
    const navigate = useNavigate();

    return (
        <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh' }}>
            <Navbar bg="primary" variant="dark" className="mb-4">
                <Container>
                    <Navbar.Brand style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        CoreShift
                    </Navbar.Brand>
                    <Button variant="light" size="sm" onClick={() => navigate('/')}>
                        ← Back to Home
                    </Button>
                </Container>
            </Navbar>

            <Container className="py-5">
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold mb-3">About CoreShift</h1>
                    <p className="lead">AI-Powered Code Migration & Refactoring Assistant</p>
                </div>

                <Row className="mb-5">
                    <Col lg={12}>
                        <Card className="shadow-sm">
                            <Card.Body className="p-5">
                                <h2 className="mb-4">📖 Project Overview</h2>
                                <p className="lead">
                                    CoreShift is an innovative AI-powered platform designed to automate 
                                    the process of code migration and refactoring.
                                </p>
                                <p><strong>Student:</strong> Jinumol James</p>
                                <p><strong>Course:</strong> BCA Final Year</p>
                                <p><strong>College:</strong> CMS College Kottayam</p>
                                <p><strong>Guide:</strong> Mrs. Delsey MJ</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <div className="text-center">
                    <Button 
                        variant="success" 
                        size="lg"
                        onClick={() => navigate('/register')}
                    >
                        Try CoreShift Now
                    </Button>
                </div>
            </Container>
        </div>
    );
}

export default AboutPage;