import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Navbar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectAPI } from '../../services/api';
import axios from 'axios';

function ProjectView() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State
    const [code, setCode] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('python');
    const [fileId, setFileId] = useState(null);
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [transformedCode, setTransformedCode] = useState('');
    const [explanation, setExplanation] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [projectData, setProjectData] = useState(null);
    const [viewMode, setViewMode] = useState('loading'); // 'loading', 'view', 'transform'

    // Fetch project data on component mount
    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/projects/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            const project = response.data;
            setProjectData(project);

            // If project has transformed code, show it (view mode)
            if (project.transformed_code && project.status === 'completed') {
                setViewMode('view');
                setCode(project.original_code || '');
                setTransformedCode(project.transformed_code);
                setDetectedLanguage(project.source_language);
                setTargetLanguage(project.target_language);
                setExplanation(project.explanation || '');
                setSummary(project.summary || '');
            } else {
                // No transformed code yet, allow transformation
                setViewMode('transform');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
            toast.error('Failed to load project');
            setViewMode('transform');
        }
    };

    const handleUpload = async () => {
        if (!code.trim()) {
            toast.error('Please enter some code');
            return;
        }

        setLoading(true);
        try {
            const response = await projectAPI.uploadCode(id, { code });
            setFileId(response.data.file_id);
            setDetectedLanguage(response.data.detected_language);
            toast.success(`Code uploaded! Detected: ${response.data.detected_language}`);
            setStep(2);
        } catch (error) {
            toast.error('Failed to upload code');
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        setLoading(true);
        try {
            const response = await projectAPI.migrate(id, {
                file_id: fileId,
                target_language: targetLanguage,
            });

            setTransformedCode(response.data.migration.transformed_code);
            setExplanation(response.data.explanation);
            setSummary(response.data.summary);
            toast.success('Migration completed successfully!');
            setStep(3);
            setViewMode('view');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Migration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (format) => {
        if (!transformedCode) {
            toast.error('No transformed code to download!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/download/${format}`,
                {
                    originalCode: code,
                    transformedCode: transformedCode,
                    sourceLanguage: detectedLanguage,
                    targetLanguage: targetLanguage,
                    projectName: projectData?.project_name || 'Code Migration'
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            const ext = format === 'txt' ? 'txt' : format === 'pdf' ? 'pdf' : 'docx';
            link.setAttribute('download', `${projectData?.project_name || 'code'}-${Date.now()}.${ext}`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success(`Downloaded as ${format.toUpperCase()}!`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file');
        }
    };

    const copyToClipboard = (content, type) => {
        navigator.clipboard.writeText(content);
        toast.success(`${type} code copied to clipboard!`);
    };

    // Loading state
    if (viewMode === 'loading') {
        return (
            <Container className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading project...</p>
            </Container>
        );
    }

    // View Mode - Show completed transformation
    if (viewMode === 'view') {
        return (
            <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <Navbar bg="success" variant="dark" className="mb-4">
                    <Container>
                        <Navbar.Brand style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            🚀 CoreShift - {projectData?.project_name}
                        </Navbar.Brand>
                        <Button variant="light" size="sm" onClick={() => navigate('/dashboard')}>
                            ← Back to Dashboard
                        </Button>
                    </Container>
                </Navbar>

                <Container className="py-4">
                    {/* Download Options */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">📥 Download Options</h5>
                                    <small className="text-muted">Download your transformed code in multiple formats</small>
                                </div>
                                <div className="btn-group">
                                    <Button variant="danger" onClick={() => handleDownload('pdf')}>
                                        📄 PDF
                                    </Button>
                                    <Button variant="primary" onClick={() => handleDownload('docx')}>
                                        📝 Word
                                    </Button>
                                    <Button variant="success" onClick={() => handleDownload('txt')}>
                                        📋 Text
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Code Display */}
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Tabs defaultActiveKey="comparison" className="mb-3">
                                <Tab eventKey="comparison" title="📊 Side-by-Side Comparison">
                                    <Row>
                                        <Col md={6}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5>📝 Original Code ({detectedLanguage})</h5>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline-primary"
                                                    onClick={() => copyToClipboard(code, 'Original')}
                                                >
                                                    📋 Copy
                                                </Button>
                                            </div>
                                            <pre style={{ 
                                                background: '#f5f5f5', 
                                                padding: '15px', 
                                                borderRadius: '8px',
                                                maxHeight: '600px',
                                                overflow: 'auto',
                                                fontSize: '13px',
                                                border: '1px solid #ddd'
                                            }}>
                                                <code>{code}</code>
                                            </pre>
                                        </Col>
                                        <Col md={6}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h5>✨ Transformed Code ({targetLanguage})</h5>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline-success"
                                                    onClick={() => copyToClipboard(transformedCode, 'Transformed')}
                                                >
                                                    📋 Copy
                                                </Button>
                                            </div>
                                            <pre style={{ 
                                                background: '#e8f5e9', 
                                                padding: '15px', 
                                                borderRadius: '8px',
                                                maxHeight: '600px',
                                                overflow: 'auto',
                                                fontSize: '13px',
                                                border: '1px solid #c8e6c9'
                                            }}>
                                                <code>{transformedCode}</code>
                                            </pre>
                                        </Col>
                                    </Row>
                                </Tab>
                                
                                {explanation && (
                                    <Tab eventKey="explanation" title="💡 AI Explanation">
                                        <Card className="bg-light border-0">
                                            <Card.Body>
                                                {summary && (
                                                    <>
                                                        <h5>📌 Summary</h5>
                                                        <p className="lead">{summary}</p>
                                                        <hr />
                                                    </>
                                                )}
                                                <h5>📖 Detailed Explanation</h5>
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{explanation}</p>
                                            </Card.Body>
                                        </Card>
                                    </Tab>
                                )}
                                
                                <Tab eventKey="transformed" title="📄 Transformed Code Only">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Transformed Code ({targetLanguage})</h5>
                                        <Button 
                                            variant="success"
                                            onClick={() => copyToClipboard(transformedCode, 'Transformed')}
                                        >
                                            📋 Copy to Clipboard
                                        </Button>
                                    </div>
                                    <pre style={{ 
                                        background: '#f5f5f5', 
                                        padding: '20px', 
                                        borderRadius: '8px',
                                        maxHeight: '600px',
                                        overflow: 'auto',
                                        fontSize: '14px',
                                        border: '1px solid #ddd'
                                    }}>
                                        <code>{transformedCode}</code>
                                    </pre>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>

                    {/* Project Info */}
                    {projectData && (
                        <Card className="mt-4 shadow-sm">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">ℹ️ Project Information</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Project Name:</strong> {projectData.project_name}</p>
                                        <p><strong>Status:</strong> <span className="badge bg-success">{projectData.status}</span></p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Source Language:</strong> {detectedLanguage}</p>
                                        <p><strong>Target Language:</strong> {targetLanguage}</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </div>
        );
    }

    // Transform Mode - Original 3-step process
    return (
        <div style={{ backgroundColor: '#87CEEB', minHeight: '100vh' }}>
            <Navbar bg="success" variant="dark" className="mb-4">
                <Container>
                    <Navbar.Brand style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        CoreShift - Code Migration
                    </Navbar.Brand>
                    <Button variant="light" size="sm" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </Button>
                </Container>
            </Navbar>

            <Container className="py-4">
                {/* Step Indicator */}
                <div className="text-center mb-4">
                    <h4>
                        <span className={`badge ${step >= 1 ? 'bg-success' : 'bg-secondary'} me-2`}>1. Upload</span>
                        <span className={`badge ${step >= 2 ? 'bg-success' : 'bg-secondary'} me-2`}>2. Configure</span>
                        <span className={`badge ${step >= 3 ? 'bg-success' : 'bg-secondary'}`}>3. Results</span>
                    </h4>
                </div>

                {/* Step 1: Upload Code */}
                {step === 1 && (
                    <Card>
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">Step 1: Upload Your Code</h4>
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Paste your legacy code here:</strong></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={20}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Paste your C, C++, Java, or other code here..."
                                    style={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }}
                                />
                                <Form.Text className="text-muted">
                                    Supports: C, C++, Java, JavaScript, and more
                                </Form.Text>
                            </Form.Group>
                            <Button 
                                variant="success" 
                                size="lg"
                                onClick={handleUpload} 
                                disabled={loading || !code.trim()}
                            >
                                {loading ? 'Analyzing...' : 'Upload & Detect Language →'}
                            </Button>
                        </Card.Body>
                    </Card>
                )}

                {/* Step 2: Select Target Language */}
                {step === 2 && (
                    <Card>
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">Step 2: Choose Target Language</h4>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <h5>Detected Source Language:</h5>
                                    <h3><span className="badge bg-info">{detectedLanguage}</span></h3>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label><strong>Select Target Language:</strong></Form.Label>
                                        <Form.Select
                                            size="lg"
                                            value={targetLanguage}
                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                        >
                                            <option value="python">Python</option>
                                            <option value="java">Java</option>
                                            <option value="javascript">JavaScript</option>
                                            <option value="typescript">TypeScript</option>
                                            <option value="go">Go</option>
                                            <option value="rust">Rust</option>
                                            <option value="csharp">C#</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <hr />
                            <div className="d-flex gap-2">
                                <Button variant="secondary" onClick={() => setStep(1)}>
                                    ← Back
                                </Button>
                                <Button 
                                    variant="success" 
                                    size="lg"
                                    onClick={handleMigrate} 
                                    disabled={loading}
                                >
                                    {loading ? 'Migrating with AI... (this may take 30 seconds)' : '🚀 Start AI Migration →'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* Step 3: Results - After migration in transform mode */}
                {step === 3 && viewMode === 'transform' && (
                    <div>
                        <Card className="mb-3">
                            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">✅ Migration Complete!</h4>
                                <div className="btn-group">
                                    <Button variant="danger" onClick={() => handleDownload('pdf')}>
                                        📄 PDF
                                    </Button>
                                    <Button variant="primary" onClick={() => handleDownload('docx')}>
                                        📝 Word
                                    </Button>
                                    <Button variant="success" onClick={() => handleDownload('txt')}>
                                        📋 Text
                                    </Button>
                                </div>
                            </Card.Header>
                        </Card>

                        <Card>
                            <Card.Body>
                                <Tabs defaultActiveKey="comparison" className="mb-3">
                                    <Tab eventKey="comparison" title="Side-by-Side Comparison">
                                        <Row>
                                            <Col md={6}>
                                                <h5>Original Code ({detectedLanguage})</h5>
                                                <pre style={{ 
                                                    background: '#f5f5f5', 
                                                    padding: '15px', 
                                                    borderRadius: '5px',
                                                    maxHeight: '500px',
                                                    overflow: 'auto',
                                                    fontSize: '13px'
                                                }}>
                                                    <code>{code}</code>
                                                </pre>
                                            </Col>
                                            <Col md={6}>
                                                <h5>Transformed Code ({targetLanguage})</h5>
                                                <pre style={{ 
                                                    background: '#e8f5e9', 
                                                    padding: '15px', 
                                                    borderRadius: '5px',
                                                    maxHeight: '500px',
                                                    overflow: 'auto',
                                                    fontSize: '13px'
                                                }}>
                                                    <code>{transformedCode}</code>
                                                </pre>
                                            </Col>
                                        </Row>
                                    </Tab>
                                    
                                    <Tab eventKey="explanation" title="AI Explanation">
                                        <Card className="bg-light">
                                            <Card.Body>
                                                <h5>Summary</h5>
                                                <p className="lead">{summary}</p>
                                                <hr />
                                                <h5>Detailed Explanation</h5>
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{explanation}</p>
                                            </Card.Body>
                                        </Card>
                                    </Tab>
                                    
                                    <Tab eventKey="transformed" title="Transformed Code Only">
                                        <pre style={{ 
                                            background: '#f5f5f5', 
                                            padding: '15px', 
                                            borderRadius: '5px',
                                            maxHeight: '600px',
                                            overflow: 'auto'
                                        }}>
                                            <code>{transformedCode}</code>
                                        </pre>
                                    </Tab>
                                </Tabs>

                                <div className="text-center mt-4">
                                    <Button 
                                        variant="primary" 
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        ← Back to Dashboard
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default ProjectView;