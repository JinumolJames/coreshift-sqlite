const express = require('express');
const router = express.Router();
const DownloadService = require('../services/downloadService');
const auth = require('../middleware/auth');

/**
 * Download transformed code as DOCX (Authenticated)
 * POST /api/download/docx
 */
router.post('/docx', auth, async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage, projectName } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = await DownloadService.generateDOCX(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            projectName
        );

        const filename = `${projectName || 'code-transformation'}-${Date.now()}.docx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('DOCX download error:', error);
        res.status(500).json({ error: 'Failed to generate DOCX file' });
    }
});

/**
 * Download transformed code as PDF (Authenticated)
 * POST /api/download/pdf
 */
router.post('/pdf', auth, async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage, projectName } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = await DownloadService.generatePDF(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            projectName
        );

        const filename = `${projectName || 'code-transformation'}-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('PDF download error:', error);
        res.status(500).json({ error: 'Failed to generate PDF file' });
    }
});

/**
 * Download as TXT (Authenticated)
 * POST /api/download/txt
 */
router.post('/txt', auth, async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage, projectName } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = DownloadService.generateTXT(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            projectName
        );

        const filename = `${projectName || 'code-transformation'}-${Date.now()}.txt`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('TXT download error:', error);
        res.status(500).json({ error: 'Failed to generate TXT file' });
    }
});

/**
 * Download comparison report as Markdown (Authenticated)
 * POST /api/download/report
 */
router.post('/report', auth, async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage, projectName, explanation } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = DownloadService.generateReport(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            projectName,
            explanation
        );

        const filename = `${projectName || 'code-transformation'}-report-${Date.now()}.md`;

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Report download error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// =============================================
// GUEST DOWNLOAD ROUTES (No Authentication)
// =============================================

/**
 * Download as DOCX (Guest)
 * POST /api/download/guest/docx
 */
router.post('/guest/docx', async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = await DownloadService.generateDOCX(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            'Guest Transformation'
        );

        const filename = `code-transformation-${Date.now()}.docx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Guest DOCX download error:', error);
        res.status(500).json({ error: 'Failed to generate DOCX file' });
    }
});

/**
 * Download as PDF (Guest)
 * POST /api/download/guest/pdf
 */
router.post('/guest/pdf', async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = await DownloadService.generatePDF(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            'Guest Transformation'
        );

        const filename = `code-transformation-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Guest PDF download error:', error);
        res.status(500).json({ error: 'Failed to generate PDF file' });
    }
});

/**
 * Download as TXT (Guest)
 * POST /api/download/guest/txt
 */
router.post('/guest/txt', async (req, res) => {
    try {
        const { originalCode, transformedCode, sourceLanguage, targetLanguage } = req.body;

        if (!originalCode || !transformedCode || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const buffer = DownloadService.generateTXT(
            originalCode,
            transformedCode,
            sourceLanguage,
            targetLanguage,
            'Guest Transformation'
        );

        const filename = `code-transformation-${Date.now()}.txt`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Guest TXT download error:', error);
        res.status(500).json({ error: 'Failed to generate TXT file' });
    }
});

module.exports = router;