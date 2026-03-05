import React from 'react';
import { Container, Row, Col, Card, Button, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function HowItWorksPage() {
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
                    <h1 className="display-4 fw-bold mb-3">How CoreShift Works</h1>
                    <p className="lead">Transform your legacy code in 3 simple steps</p>
                </div>

                <Row className="mb-5">
                    <Col lg={12}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body className="p-5">
                                <h2>Step 1: Create Account & Project</h2>
                                <p>Sign up and create your first migration project.</p>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm mb-4">
                            <Card.Body className="p-5">
                                <h2>Step 2: Upload Your Code</h2>
                                <p>Paste your legacy code and AI detects the language automatically.</p>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm">
                            <Card.Body className="p-5">
                                <h2>Step 3: Transform & Download</h2>
                                <p>Select target language and get your transformed code instantly!</p>
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
                        Get Started Now
                    </Button>
                </div>
            </Container>
        </div>
    );
}
export default HowItWorksPage;
