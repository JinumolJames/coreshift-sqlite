const express = require('express');
const router = express.Router();
const CodeProcessor = require('../services/codeProcessor');

/**
 * Guest Mode - Detect Language (No Auth Required)
 * POST /api/guest/detect-language
 */
router.post('/detect-language', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        console.log('Guest: Detecting language...');
        const language = await CodeProcessor.detectLanguage(code);

        res.json({
            language,
            message: 'Language detected successfully'
        });

    } catch (error) {
        console.error('Guest language detection error:', error);
        res.status(500).json({ 
            error: 'Failed to detect language',
            details: error.message 
        });
    }
});

/**
 * Guest Mode - Transform Code (No Auth Required)
 * POST /api/guest/transform
 */
router.post('/transform', async (req, res) => {
    try {
        const { code, sourceLanguage, targetLanguage } = req.body;

        if (!code || !targetLanguage) {
            return res.status(400).json({ 
                error: 'Code and target language are required' 
            });
        }

        console.log(`Guest: Transforming from ${sourceLanguage} to ${targetLanguage}...`);

        // Detect language if not provided
        let detectedLanguage = sourceLanguage;
        if (!sourceLanguage || sourceLanguage === 'Unknown') {
            detectedLanguage = await CodeProcessor.detectLanguage(code);
            console.log(`Guest: Auto-detected language: ${detectedLanguage}`);
        }

        // Clean the code
        const cleanedCode = await CodeProcessor.cleanCode(code);

        // Transform code using AI
        const result = await CodeProcessor.transformCode(
            cleanedCode,
            detectedLanguage,
            targetLanguage
        );

        res.json({
            sourceLanguage: detectedLanguage,
            targetLanguage,
            originalCode: code,
            transformedCode: result.transformed_code,
            explanation: result.explanation,
            summary: result.summary,
            warnings: result.warnings || [],
            message: 'Transformation completed successfully (Guest Mode)'
        });

    } catch (error) {
        console.error('Guest transformation error:', error);
        res.status(500).json({ 
            error: 'Failed to transform code',
            details: error.message 
        });
    }
});

module.exports = router;