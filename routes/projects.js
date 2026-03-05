const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const CodeProcessor = require('../services/codeProcessor');

const router = express.Router();

// Helper function to promisify db operations
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { project_name } = req.body;
        
        if (!project_name) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        
        const result = await dbRun(
            'INSERT INTO projects (user_id, project_name, status) VALUES (?, ?, ?)',
            [req.user_id, project_name, 'pending']
        );
        
        const project = await dbGet('SELECT * FROM projects WHERE project_id = ?', [result.lastID]);
        
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the logged-in user
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await dbAll(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
            [req.user_id]
        );
        
        res.json(projects);
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get a specific project
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await dbGet(
            'SELECT * FROM projects WHERE project_id = ? AND user_id = ?',
            [id, req.user_id]
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        console.error('Fetch project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

/**
 * @route   POST /api/projects/:project_id/upload
 * @desc    Upload and process code
 * @access  Private
 */
router.post('/:project_id/upload', authMiddleware, async (req, res) => {
    try {
        const { project_id } = req.params;
        const { code } = req.body;
        
        if (!code || code.trim().length === 0) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Verify project belongs to user
        const project = await dbGet(
            'SELECT * FROM projects WHERE project_id = ? AND user_id = ?',
            [project_id, req.user_id]
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        console.log('Detecting language...');
        const detected_language = await CodeProcessor.detectLanguage(code);
        
        console.log('Cleaning code...');
        const cleaned_code = await CodeProcessor.cleanCode(code);
        
        // Save to database
        const result = await dbRun(
            'INSERT INTO code_files (project_id, original_code, cleaned_code, detected_language) VALUES (?, ?, ?, ?)',
            [project_id, code, cleaned_code, detected_language]
        );
        
        const codeFile = await dbGet('SELECT * FROM code_files WHERE file_id = ?', [result.lastID]);
        
        console.log('Code uploaded and processed successfully');
        res.status(201).json(codeFile);
    } catch (error) {
        console.error('Upload code error:', error);
        res.status(500).json({ error: 'Failed to upload and process code' });
    }
});

/**
 * @route   POST /api/projects/:project_id/migrate
 * @desc    Migrate code to target language
 * @access  Private
 */
router.post('/:project_id/migrate', authMiddleware, async (req, res) => {
    try {
        const { project_id } = req.params;
        const { file_id, target_language } = req.body;
        
        if (!file_id || !target_language) {
            return res.status(400).json({ error: 'File ID and target language are required' });
        }
        
        // Get the code file
        const codeFile = await dbGet(
            `SELECT cf.*, p.user_id 
             FROM code_files cf 
             JOIN projects p ON cf.project_id = p.project_id 
             WHERE cf.file_id = ? AND cf.project_id = ?`,
            [file_id, project_id]
        );
        
        if (!codeFile) {
            return res.status(404).json({ error: 'Code file not found' });
        }
        
        if (codeFile.user_id !== req.user_id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const { cleaned_code, detected_language } = codeFile;
        
        console.log(`Migrating from ${detected_language} to ${target_language}...`);
        
        // Transform code using AI
        const result = await CodeProcessor.transformCode(
            cleaned_code,
            detected_language,
            target_language
        );
        
        // Save migration
        const migrationResult = await dbRun(
            'INSERT INTO migrations (project_id, transformed_code, ai_model_used, target_language) VALUES (?, ?, ?, ?)',
            [project_id, result.transformed_code, 'claude-sonnet-4', target_language]
        );
        
        const migration = await dbGet('SELECT * FROM migrations WHERE migration_id = ?', [migrationResult.lastID]);
        
        // Save explanation
        await dbRun(
            'INSERT INTO explanations (migration_id, explanation_text, summary_text) VALUES (?, ?, ?)',
            [migration.migration_id, result.explanation, result.summary]
        );
        
        // Update project status to completed
        await dbRun(
            'UPDATE projects SET status = ? WHERE project_id = ?',
            ['completed', project_id]
        );
        
        console.log('Migration completed successfully');
        
        res.json({
            migration,
            explanation: result.explanation,
            summary: result.summary,
            warnings: result.warnings || []
        });
    } catch (error) {
        console.error('Migration error:', error);
        
        // Update project status to failed
        try {
            await dbRun(
                'UPDATE projects SET status = ? WHERE project_id = ?',
                ['failed', project_id]
            );
        } catch (updateError) {
            console.error('Failed to update project status:', updateError);
        }
        
        res.status(500).json({ error: 'Code migration failed: ' + error.message });
    }
});

/**
 * @route   GET /api/projects/:project_id/migrations
 * @desc    Get all migrations for a project
 * @access  Private
 */
router.get('/:project_id/migrations', authMiddleware, async (req, res) => {
    try {
        const { project_id } = req.params;
        
        // Verify project belongs to user
        const project = await dbGet(
            'SELECT * FROM projects WHERE project_id = ? AND user_id = ?',
            [project_id, req.user_id]
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        const migrations = await dbAll(`
            SELECT 
                m.*,
                e.explanation_text,
                e.summary_text,
                cf.original_code,
                cf.detected_language
            FROM migrations m
            LEFT JOIN explanations e ON m.migration_id = e.migration_id
            LEFT JOIN code_files cf ON m.project_id = cf.project_id
            WHERE m.project_id = ?
            ORDER BY m.created_at DESC
        `, [project_id]);
        
        res.json(migrations);
    } catch (error) {
        console.error('Fetch migrations error:', error);
        res.status(500).json({ error: 'Failed to fetch migrations' });
    }
});

/**
 * @route   DELETE /api/projects/:project_id
 * @desc    Delete a project
 * @access  Private
 */
router.delete('/:project_id', authMiddleware, async (req, res) => {
    try {
        const { project_id } = req.params;
        
        const result = await dbRun(
            'DELETE FROM projects WHERE project_id = ? AND user_id = ?',
            [project_id, req.user_id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;
