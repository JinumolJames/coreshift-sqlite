import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { projectAPI } from '../../services/api';
import axios from 'axios';

function ProjectView() {
    const { id } = useParams();
    const navigate = useNavigate();

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
    const [viewMode, setViewMode] = useState('loading'); // 'loading', 'view', 'transform', '404'
    const [activeTab, setActiveTab] = useState('comparison');
    const [allMigrations, setAllMigrations] = useState([]);
    const [selectedMigrationIndex, setSelectedMigrationIndex] = useState(0);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Warn before browser close if user has unsaved progress
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const safeNavigateToDashboard = () => {
        if (isDirty && step >= 2) {
            const confirmed = window.confirm('You have unsaved progress. Are you sure you want to leave?');
            if (!confirmed) return;
        }
        navigate('/dashboard');
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchProjectData(); }, [id]);

    const fetchProjectData = async () => {
        try {
            const token = localStorage.getItem('token');
            const projectResponse = await axios.get(
                `http://localhost:5000/api/projects/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProjectData(projectResponse.data);

            const migrationsResponse = await axios.get(
                `http://localhost:5000/api/projects/${id}/migrations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const migrations = migrationsResponse.data;

            if (migrations && migrations.length > 0) {
                setAllMigrations(migrations);
                loadMigration(migrations[0]);
                setViewMode('view');
            } else {
                setViewMode('transform');
            }
        } catch (error) {
            console.error('Error fetching project:', error);
            if (error.response?.status === 404) {
                setViewMode('404');
            } else {
                toast.error('Failed to load project');
                setViewMode('transform');
            }
        }
    };

    const loadMigration = (migration) => {
        setCode(migration.original_code || '');
        setTransformedCode(migration.transformed_code || '');
        setDetectedLanguage(migration.source_language || '');
        setTargetLanguage(migration.target_language || 'python');
        setExplanation(migration.explanation || '');
        setSummary(migration.summary || '');
        setActiveTab('comparison');
    };

    const handleSelectMigration = (migration, index) => {
        setSelectedMigrationIndex(index);
        loadMigration(migration);
        setShowHistoryPanel(false);
    };

    const handleUpload = async () => {
        if (!code.trim()) { toast.error('Please enter some code'); return; }
        setLoading(true);
        try {
            const response = await projectAPI.uploadCode(id, { code });
            setFileId(response.data.file_id);
            setDetectedLanguage(response.data.detected_language);
            toast.success(`Detected: ${response.data.detected_language}`);
            setStep(2);
            setIsDirty(true);
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
            toast.success('Migration completed!');
            setStep(3);
            setIsDirty(false);
            setViewMode('view');
            fetchProjectData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Migration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReMigrate = () => {
        setViewMode('transform');
        setStep(1);
        setCode('');
        setTransformedCode('');
        setIsDirty(false);
    };

    const handleDownload = async (format) => {
        if (!transformedCode) { toast.error('No transformed code to download!'); return; }
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/download/${format}`,
                {
                    originalCode: code, transformedCode,
                    sourceLanguage: detectedLanguage, targetLanguage,
                    projectName: projectData?.project_name || 'Code Migration'
                },
                { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
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
            toast.error('Failed to download file');
        }
    };

    const copyToClipboard = (content, type) => {
        navigator.clipboard.writeText(content);
        toast.success(`${type} code copied!`);
    };

    const lineCount = code.split('\n').length;
    const charCount = code.length;

    const languages = [
        { value: 'python', label: 'Python', icon: '🐍' },
        { value: 'java', label: 'Java', icon: '☕' },
        { value: 'javascript', label: 'JavaScript', icon: '🌐' },
        { value: 'typescript', label: 'TypeScript', icon: '🔷' },
        { value: 'go', label: 'Go', icon: '🐹' },
        { value: 'rust', label: 'Rust', icon: '⚙️' },
        { value: 'csharp', label: 'C#', icon: '🎯' },
    ];

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pv-root {
            min-height: 100vh; background: #0a0a0f;
            font-family: 'DM Sans', sans-serif; color: #e2e8f0;
            position: relative; overflow-x: hidden;
        }
        .pv-root::before {
            content: ''; position: fixed; top: -30%; left: -10%;
            width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%);
            pointer-events: none; z-index: 0; animation: bgPulse 8s ease-in-out infinite;
        }
        .pv-root::after {
            content: ''; position: fixed; bottom: -20%; right: -10%;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
            pointer-events: none; z-index: 0; animation: bgPulse 10s ease-in-out infinite reverse;
        }
        @keyframes bgPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }

        .pv-nav {
            position: sticky; top: 0; z-index: 100;
            background: rgba(10,10,15,0.85); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding: 0 40px; height: 64px;
            display: flex; align-items: center; justify-content: space-between;
        }
        .pv-nav-left { display: flex; align-items: center; gap: 16px; }
        .pv-nav-right { display: flex; align-items: center; gap: 10px; }
        .pv-back-btn {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.5); padding: 7px 14px; border-radius: 8px;
            font-size: 0.82rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .pv-back-btn:hover { background: rgba(255,255,255,0.09); color: white; }
        .pv-logo {
            font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem;
            background: linear-gradient(135deg, #a78bfa, #60a5fa);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .pv-project-name {
            font-size: 0.85rem; color: rgba(255,255,255,0.35);
            display: flex; align-items: center; gap: 8px;
        }
        .pv-project-name span { color: rgba(255,255,255,0.7); font-weight: 500; }
        .pv-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; }
        .btn-remigrate {
            background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2));
            border: 1px solid rgba(167,139,250,0.3); color: #c4b5fd;
            padding: 7px 16px; border-radius: 8px; font-size: 0.82rem; cursor: pointer;
            font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-remigrate:hover { background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(59,130,246,0.35)); color: white; }
        .btn-history {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5); padding: 7px 14px; border-radius: 8px;
            font-size: 0.82rem; cursor: pointer; font-family: 'DM Sans', sans-serif;
            transition: all 0.2s; position: relative;
        }
        .btn-history:hover { background: rgba(255,255,255,0.09); color: white; }
        .history-count {
            position: absolute; top: -6px; right: -6px;
            background: #7c3aed; color: white; width: 18px; height: 18px;
            border-radius: 50%; font-size: 0.65rem; display: flex; align-items: center;
            justify-content: center; font-weight: 700;
        }

        .pv-content {
            position: relative; z-index: 1; max-width: 1200px; margin: 0 auto;
            padding: 40px; animation: fadeUp 0.5s ease forwards;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        /* History panel */
        .history-overlay {
            position: fixed; inset: 0; z-index: 200;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
            animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        .history-panel {
            position: absolute; top: 0; right: 0; bottom: 0; width: 380px;
            background: #13131a; border-left: 1px solid rgba(255,255,255,0.08);
            padding: 28px; overflow-y: auto;
            animation: slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .history-title { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; color:white; margin-bottom:4px; }
        .history-sub { font-size:0.8rem; color:rgba(255,255,255,0.3); margin-bottom:24px; }
        .history-item {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
            border-radius: 12px; padding: 16px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;
        }
        .history-item:hover, .history-item.active { background: rgba(124,58,237,0.1); border-color: rgba(167,139,250,0.3); }
        .history-item-langs { display:flex; align-items:center; gap:8px; font-size:0.85rem; color:white; font-weight:500; margin-bottom:6px; }
        .history-item-date { font-size:0.75rem; color:rgba(255,255,255,0.3); }
        .history-arrow { color:rgba(167,139,250,0.6); }
        .btn-close-history {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.5); padding: 8px 16px; border-radius: 8px;
            font-size: 0.82rem; cursor: pointer; font-family: 'DM Sans', sans-serif;
            margin-bottom: 20px; transition: all 0.2s;
        }
        .btn-close-history:hover { color: white; }

        /* Step bar */
        .step-bar { display:flex; align-items:center; justify-content:center; margin-bottom:40px; }
        .step-item {
            display:flex; align-items:center; gap:10px; padding:10px 20px; border-radius:100px;
            font-size:0.85rem; font-weight:500; color:rgba(255,255,255,0.3); transition:all 0.3s;
        }
        .step-item.active {
            background: linear-gradient(135deg,rgba(124,58,237,0.2),rgba(59,130,246,0.2));
            border: 1px solid rgba(167,139,250,0.3); color:#c4b5fd;
        }
        .step-item.done { color:#10b981; }
        .step-num {
            width:26px; height:26px; border-radius:50%; display:flex; align-items:center;
            justify-content:center; font-size:0.78rem; font-weight:700;
            background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
        }
        .step-item.active .step-num { background:linear-gradient(135deg,#7c3aed,#3b82f6); border:none; color:white; }
        .step-item.done .step-num { background:rgba(16,185,129,0.2); border-color:rgba(16,185,129,0.4); color:#10b981; }
        .step-divider { width:40px; height:1px; background:rgba(255,255,255,0.08); }

        .pv-card {
            background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
            border-radius:20px; overflow:hidden; margin-bottom:20px;
        }
        .pv-card-header {
            padding:20px 28px; border-bottom:1px solid rgba(255,255,255,0.06);
            display:flex; align-items:center; justify-content:space-between;
        }
        .pv-card-title { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; color:white; display:flex; align-items:center; gap:10px; }
        .pv-card-body { padding:28px; }

        .code-textarea {
            width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08);
            border-radius:12px; padding:18px 20px; color:#e2e8f0;
            font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.7;
            resize:vertical; min-height:380px; outline:none; transition:all 0.2s;
        }
        .code-textarea::placeholder { color:rgba(255,255,255,0.15); }
        .code-textarea:focus { border-color:rgba(167,139,250,0.4); box-shadow:0 0 0 3px rgba(124,58,237,0.1); }
        .code-meta { display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
        .code-hint { font-size:0.78rem; color:rgba(255,255,255,0.25); }
        .code-stats { font-size:0.75rem; color:rgba(255,255,255,0.2); display:flex; gap:12px; }
        .code-stats span { color:rgba(167,139,250,0.6); }

        .btn-primary-pv {
            background:linear-gradient(135deg,#7c3aed,#3b82f6); border:none; color:white;
            padding:12px 28px; border-radius:12px; font-size:0.9rem; font-weight:500; cursor:pointer;
            font-family:'DM Sans',sans-serif; transition:all 0.3s;
            box-shadow:0 4px 15px rgba(124,58,237,0.3);
            display:inline-flex; align-items:center; gap:8px;
        }
        .btn-primary-pv:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 25px rgba(124,58,237,0.5); }
        .btn-primary-pv:disabled { opacity:0.5; cursor:not-allowed; }
        .btn-secondary-pv {
            background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
            color:rgba(255,255,255,0.6); padding:12px 20px; border-radius:12px;
            font-size:0.9rem; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
        }
        .btn-secondary-pv:hover { background:rgba(255,255,255,0.08); color:white; }

        .lang-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; margin-bottom:28px; }
        .lang-option {
            background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
            border-radius:12px; padding:14px 12px; text-align:center; cursor:pointer;
            transition:all 0.2s; font-size:0.88rem; color:rgba(255,255,255,0.5);
        }
        .lang-option:hover { background:rgba(255,255,255,0.07); border-color:rgba(167,139,250,0.3); color:white; }
        .lang-option.selected {
            background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(59,130,246,0.2));
            border-color:rgba(167,139,250,0.5); color:#c4b5fd; font-weight:500;
        }
        .lang-icon { font-size:1.5rem; margin-bottom:6px; }
        .detected-badge {
            display:inline-flex; align-items:center; gap:8px;
            background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25);
            color:#6ee7b7; padding:8px 16px; border-radius:100px;
            font-size:0.85rem; font-weight:500; margin-bottom:28px;
        }

        .pv-tabs {
            display:flex; gap:4px; background:rgba(255,255,255,0.03);
            border:1px solid rgba(255,255,255,0.07); border-radius:12px;
            padding:4px; margin-bottom:24px; width:fit-content;
        }
        .pv-tab {
            padding:8px 18px; border-radius:9px; font-size:0.85rem; cursor:pointer;
            color:rgba(255,255,255,0.4); transition:all 0.2s; border:none;
            background:transparent; font-family:'DM Sans',sans-serif;
        }
        .pv-tab.active { background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.3)); color:#c4b5fd; font-weight:500; }
        .pv-tab:hover:not(.active) { color:rgba(255,255,255,0.7); }

        .code-block-wrap { border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,0.07); }
        .code-block-header {
            background:rgba(255,255,255,0.04); padding:10px 18px;
            display:flex; align-items:center; justify-content:space-between;
            border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .code-lang-tag {
            font-size:0.75rem; font-weight:600; color:rgba(255,255,255,0.4);
            text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center; gap:8px;
        }
        .code-lang-tag::before { content:''; width:8px; height:8px; border-radius:50%; }
        .original-tag::before { background:#f59e0b; }
        .transformed-tag::before { background:#10b981; }
        .btn-copy {
            background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
            color:rgba(255,255,255,0.45); padding:5px 12px; border-radius:7px;
            font-size:0.75rem; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
        }
        .btn-copy:hover { background:rgba(255,255,255,0.09); color:white; }
        .code-pre {
            background:#0d0d14; padding:20px; margin:0; max-height:500px; overflow:auto;
            font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.7; color:#cdd6f4;
        }
        .code-pre::-webkit-scrollbar { width:6px; height:6px; }
        .code-pre::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
        .comparison-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

        .download-bar {
            background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
            border-radius:16px; padding:18px 24px;
            display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;
        }
        .download-label { font-size:0.88rem; color:rgba(255,255,255,0.5); }
        .download-label strong { color:white; display:block; font-size:0.95rem; margin-bottom:2px; }
        .download-btns { display:flex; gap:10px; }
        .btn-download { padding:9px 18px; border-radius:10px; font-size:0.83rem; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; border:1px solid; display:flex; align-items:center; gap:6px; }
        .btn-dl-pdf { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.25); color:#fca5a5; }
        .btn-dl-pdf:hover { background:rgba(239,68,68,0.2); border-color:rgba(239,68,68,0.4); }
        .btn-dl-word { background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#93c5fd; }
        .btn-dl-word:hover { background:rgba(59,130,246,0.2); border-color:rgba(59,130,246,0.4); }
        .btn-dl-txt { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25); color:#6ee7b7; }
        .btn-dl-txt:hover { background:rgba(16,185,129,0.2); border-color:rgba(16,185,129,0.4); }

        .explanation-box { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:24px; }
        .explanation-title { font-family:'Syne',sans-serif; font-size:0.85rem; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
        .explanation-text { font-size:0.9rem; line-height:1.8; color:rgba(255,255,255,0.65); white-space:pre-wrap; }
        .summary-text { font-size:1rem; line-height:1.7; color:rgba(255,255,255,0.8); margin-bottom:20px; }
        .divider { height:1px; background:rgba(255,255,255,0.06); margin:20px 0; }

        .info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .info-item { padding:16px 20px; background:rgba(255,255,255,0.03); border-radius:12px; }
        .info-key { font-size:0.75rem; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
        .info-val { font-size:0.95rem; color:white; font-weight:500; }

        .pv-loading { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; flex-direction:column; gap:16px; }
        .pv-spinner { width:40px; height:40px; border-radius:50%; border:3px solid rgba(167,139,250,0.15); border-top-color:#a78bfa; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .pv-loading-text { font-size:0.9rem; color:rgba(255,255,255,0.35); }

        .not-found { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; flex-direction:column; gap:16px; text-align:center; padding:40px; }
        .not-found-icon { font-size:4rem; margin-bottom:8px; opacity:0.4; }
        .not-found-title { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; color:white; margin-bottom:8px; }
        .not-found-sub { font-size:0.9rem; color:rgba(255,255,255,0.3); margin-bottom:28px; }

        @media (max-width:768px) {
            .pv-content { padding:24px 16px; }
            .pv-nav { padding:0 16px; }
            .comparison-grid { grid-template-columns:1fr; }
            .download-bar { flex-direction:column; gap:14px; align-items:flex-start; }
            .info-grid { grid-template-columns:1fr; }
            .history-panel { width:100%; }
        }
    `;

    const MiniSpinner = () => (
        <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div>
    );

    // ── Loading ──────────────────────────────────────────────────
    if (viewMode === 'loading') {
        return (
            <>
                <style>{styles}</style>
                <div className="pv-loading">
                    <div className="pv-spinner"></div>
                    <p className="pv-loading-text">Loading project...</p>
                </div>
            </>
        );
    }

    // ── 404 ──────────────────────────────────────────────────────
    if (viewMode === '404') {
        return (
            <>
                <style>{styles}</style>
                <div className="not-found">
                    <div className="not-found-icon">🔍</div>
                    <div className="not-found-title">Project Not Found</div>
                    <p className="not-found-sub">This project doesn't exist or you don't have access to it.</p>
                    <button className="btn-primary-pv" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </>
        );
    }

    // ── Shared Navbar ────────────────────────────────────────────
    const NavBar = () => (
        <nav className="pv-nav">
            <div className="pv-nav-left">
                <button className="pv-back-btn" onClick={safeNavigateToDashboard}>← Dashboard</button>
                <div className="pv-logo">CoreShift</div>
                {projectData && (
                    <div className="pv-project-name">
                        / <span>{projectData.project_name}</span>
                        {viewMode === 'view' && <div className="pv-status-dot"></div>}
                    </div>
                )}
            </div>
            {viewMode === 'view' && (
                <div className="pv-nav-right">
                    {allMigrations.length > 1 && (
                        <button className="btn-history" onClick={() => setShowHistoryPanel(true)}>
                            🕓 History
                            <span className="history-count">{allMigrations.length}</span>
                        </button>
                    )}
                    <button className="btn-remigrate" onClick={handleReMigrate}>↺ Migrate Again</button>
                </div>
            )}
        </nav>
    );

    // ── VIEW MODE ────────────────────────────────────────────────
    if (viewMode === 'view') {
        return (
            <>
                <style>{styles}</style>
                <div className="pv-root">
                    <NavBar />

                    {/* History Panel */}
                    {showHistoryPanel && (
                        <div className="history-overlay" onClick={() => setShowHistoryPanel(false)}>
                            <div className="history-panel" onClick={(e) => e.stopPropagation()}>
                                <button className="btn-close-history" onClick={() => setShowHistoryPanel(false)}>✕ Close</button>
                                <div className="history-title">Migration History</div>
                                <div className="history-sub">{allMigrations.length} migration{allMigrations.length > 1 ? 's' : ''} for this project</div>
                                {allMigrations.map((m, index) => (
                                    <div
                                        key={m.migration_id}
                                        className={`history-item ${selectedMigrationIndex === index ? 'active' : ''}`}
                                        onClick={() => handleSelectMigration(m, index)}
                                    >
                                        <div className="history-item-langs">
                                            {m.source_language || 'Unknown'}
                                            <span className="history-arrow">→</span>
                                            {m.target_language}
                                            {index === 0 && (
                                                <span style={{ fontSize:'0.7rem', background:'rgba(124,58,237,0.2)', color:'#a78bfa', padding:'2px 8px', borderRadius:'100px', marginLeft:4 }}>
                                                    Latest
                                                </span>
                                            )}
                                        </div>
                                        <div className="history-item-date">
                                            {new Date(m.created_at).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pv-content">
                        <div className="download-bar">
                            <div className="download-label">
                                <strong>📥 Export Results</strong>
                                Download your migration in multiple formats
                            </div>
                            <div className="download-btns">
                                <button className="btn-download btn-dl-pdf" onClick={() => handleDownload('pdf')}>📄 PDF</button>
                                <button className="btn-download btn-dl-word" onClick={() => handleDownload('docx')}>📝 Word</button>
                                <button className="btn-download btn-dl-txt" onClick={() => handleDownload('txt')}>📋 Text</button>
                            </div>
                        </div>

                        <div className="pv-tabs">
                            <button className={`pv-tab ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>⚡ Side by Side</button>
                            <button className={`pv-tab ${activeTab === 'transformed' ? 'active' : ''}`} onClick={() => setActiveTab('transformed')}>✨ Result Only</button>
                            {explanation && (
                                <button className={`pv-tab ${activeTab === 'explanation' ? 'active' : ''}`} onClick={() => setActiveTab('explanation')}>💡 AI Explanation</button>
                            )}
                            <button className={`pv-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>ℹ️ Info</button>
                        </div>

                        {activeTab === 'comparison' && (
                            <div className="comparison-grid">
                                <div className="code-block-wrap">
                                    <div className="code-block-header">
                                        <span className="code-lang-tag original-tag">Original · {detectedLanguage}</span>
                                        <button className="btn-copy" onClick={() => copyToClipboard(code, 'Original')}>Copy</button>
                                    </div>
                                    <pre className="code-pre"><code>{code}</code></pre>
                                </div>
                                <div className="code-block-wrap">
                                    <div className="code-block-header">
                                        <span className="code-lang-tag transformed-tag">Transformed · {targetLanguage}</span>
                                        <button className="btn-copy" onClick={() => copyToClipboard(transformedCode, 'Transformed')}>Copy</button>
                                    </div>
                                    <pre className="code-pre"><code>{transformedCode}</code></pre>
                                </div>
                            </div>
                        )}

                        {activeTab === 'transformed' && (
                            <div className="code-block-wrap">
                                <div className="code-block-header">
                                    <span className="code-lang-tag transformed-tag">Transformed · {targetLanguage}</span>
                                    <button className="btn-copy" onClick={() => copyToClipboard(transformedCode, 'Transformed')}>Copy to Clipboard</button>
                                </div>
                                <pre className="code-pre"><code>{transformedCode}</code></pre>
                            </div>
                        )}

                        {activeTab === 'explanation' && (
                            <div className="explanation-box">
                                {summary && (
                                    <>
                                        <div className="explanation-title">📌 Summary</div>
                                        <p className="summary-text">{summary}</p>
                                        <div className="divider"></div>
                                    </>
                                )}
                                <div className="explanation-title">📖 Detailed Explanation</div>
                                <p className="explanation-text">{explanation}</p>
                            </div>
                        )}

                        {activeTab === 'info' && projectData && (
                            <div className="info-grid">
                                <div className="info-item"><div className="info-key">Project Name</div><div className="info-val">{projectData.project_name}</div></div>
                                <div className="info-item"><div className="info-key">Status</div><div className="info-val" style={{ color:'#10b981' }}>✓ {projectData.status}</div></div>
                                <div className="info-item"><div className="info-key">Source Language</div><div className="info-val">{detectedLanguage}</div></div>
                                <div className="info-item"><div className="info-key">Target Language</div><div className="info-val">{targetLanguage}</div></div>
                                <div className="info-item"><div className="info-key">Total Migrations</div><div className="info-val">{allMigrations.length}</div></div>
                                <div className="info-item"><div className="info-key">Created</div><div className="info-val">{new Date(projectData.created_at).toLocaleDateString()}</div></div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // ── TRANSFORM MODE ───────────────────────────────────────────
    return (
        <>
            <style>{styles}</style>
            <div className="pv-root">
                <NavBar />
                <div className="pv-content">
                    <div className="step-bar">
                        <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                            <div className="step-num">{step > 1 ? '✓' : '1'}</div>Upload
                        </div>
                        <div className="step-divider"></div>
                        <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
                            <div className="step-num">{step > 2 ? '✓' : '2'}</div>Configure
                        </div>
                        <div className="step-divider"></div>
                        <div className={`step-item ${step === 3 ? 'active' : ''}`}>
                            <div className="step-num">3</div>Results
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="pv-card">
                            <div className="pv-card-header">
                                <div className="pv-card-title"><span>📋</span> Paste Your Legacy Code</div>
                            </div>
                            <div className="pv-card-body">
                                <textarea
                                    className="code-textarea"
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value); setIsDirty(e.target.value.length > 0); }}
                                    placeholder="Paste your C, C++, Java, or other legacy code here..."
                                />
                                <div className="code-meta">
                                    <p className="code-hint">Supports: C, C++, Java, JavaScript, Python, and more</p>
                                    {code.length > 0 && (
                                        <div className="code-stats">
                                            <span>{lineCount}</span> lines &nbsp; <span>{charCount}</span> chars
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop:'20px' }}>
                                    <button className="btn-primary-pv" onClick={handleUpload} disabled={loading || !code.trim()}>
                                        {loading ? <><MiniSpinner /> Analyzing...</> : <>Detect Language →</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="pv-card">
                            <div className="pv-card-header">
                                <div className="pv-card-title"><span>🎯</span> Choose Target Language</div>
                            </div>
                            <div className="pv-card-body">
                                <div className="detected-badge">
                                    <span>🔍</span> Detected source language: <strong>{detectedLanguage}</strong>
                                </div>
                                <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', marginBottom:'16px' }}>
                                    Select the language to migrate your code to:
                                </p>
                                <div className="lang-grid">
                                    {languages.map(lang => (
                                        <div
                                            key={lang.value}
                                            className={`lang-option ${targetLanguage === lang.value ? 'selected' : ''}`}
                                            onClick={() => setTargetLanguage(lang.value)}
                                        >
                                            <div className="lang-icon">{lang.icon}</div>
                                            {lang.label}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display:'flex', gap:'12px' }}>
                                    <button className="btn-secondary-pv" onClick={() => setStep(1)}>← Back</button>
                                    <button className="btn-primary-pv" onClick={handleMigrate} disabled={loading}>
                                        {loading ? <><MiniSpinner /> Migrating with AI... (may take 30s)</> : <>🚀 Start AI Migration</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ProjectView;