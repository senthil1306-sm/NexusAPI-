/**
 * app.js - NexusAPI
 * Main Application Bootstrapper
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Core Modules
    const parser = new window.CodeParser();
    const aiAnalyzer = new window.AIAnalyzer();
    const sdkGen = new window.SDKGenerator();
    window.UI = new window.UIController(); // Make available globally for inline onclicks

    // DOM Elements
    const btnAnalyze = document.getElementById('btnAnalyzeCode');
    const btnSample = document.getElementById('btnLoadSample');
    const codeInput = document.getElementById('sourceCodeInput');
    const overlay = document.getElementById('aiOverlay');
    const aiStatusText = document.getElementById('aiStatusText');

    let currentEndpoints = [];

    // Load Sample Data
    btnSample.addEventListener('click', () => {
        codeInput.value = `const express = require('express');
const router = express.Router();

// Get list of users
router.get('/users', (req, res) => {
    const limit = req.query.limit;
    res.json([]);
});

// Create a new user
router.post('/users', (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    res.status(201).json({ id: 1 });
});

// Update specific product
app.put('/products/:id', (req, res) => {
    const price = req.body.price;
    res.json({ success: true });
});

// Delete an order
app.delete('/orders/:id', (req, res) => {
    res.status(204).send();
});
`;
    });

    // Analyze Code Flow
    btnAnalyze.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        if(!code) {
            alert("Please paste some Express.js backend code to analyze.");
            return;
        }

        // Show Overlay
        overlay.classList.remove('hidden');
        
        try {
            // STEP 1: Parse
            aiStatusText.innerText = "Extracting AST routes & parameters...";
            const parsed = parser.parse(code);
            
            if(parsed.length === 0) {
                alert("No valid Express.js routes detected. Make sure to use app.get(), router.post(), etc.");
                overlay.classList.add('hidden');
                return;
            }

            // STEP 2: AI Enrichment
            aiStatusText.innerText = "AI is inferring data schemas and generating descriptions...";
            currentEndpoints = await aiAnalyzer.analyze(parsed);

            // STEP 3: Generate SDK and Views
            aiStatusText.innerText = "Building Interactive Explorer & SDKs...";
            
            window.UI.setEndpoints(currentEndpoints);
            window.UI.enableNav();
            window.UI.renderExplorer();
            window.UI.renderDocs();
            updateSdkView('javascript');

            // Switch to Explorer view after 500ms
            setTimeout(() => {
                overlay.classList.add('hidden');
                document.getElementById('nav-explorer').click();
            }, 500);

        } catch(e) {
            console.error(e);
            alert("An error occurred during analysis.");
            overlay.classList.add('hidden');
        }
    });

    // Handle SDK Tab switches
    document.addEventListener('sdkLanguageChanged', (e) => {
        updateSdkView(e.detail);
    });

    function updateSdkView(language) {
        if(currentEndpoints.length === 0) return;
        const code = sdkGen.generate(language, currentEndpoints);
        window.UI.renderSdk(code);
    }
});
