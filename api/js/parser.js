/**
 * parser.js - NexusAPI
 * A mock AST/Regex parser to extract endpoint definitions from source code
 */

class CodeParser {
    constructor() {
        // Regex patterns to identify Express.js style routes
        // e.g. router.get('/path/:id', ...) or app.post('/data', ...)
        this.routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/g;
        
        // Match req.body.something or req.query.something or req.params.something inside route scopes
        this.paramsRegex = /req\.(body|query|params)\.([a-zA-Z0-9_]+)/g;
    }

    parse(sourceCode) {
        let endpoints = [];
        let match;

        // Reset regex state
        this.routeRegex.lastIndex = 0;

        // Very simplified parsing strategy for the mock demo
        // We find the route, then we assume the block of code immediately following it belongs to it for parameter extraction
        let previousIndex = 0;
        let blocks = [];

        while ((match = this.routeRegex.exec(sourceCode)) !== null) {
            blocks.push({
                method: match[1].toUpperCase(),
                path: match[2],
                index: match.index
            });
        }

        // For each block, extract the text between this route and the next to find params
        for (let i = 0; i < blocks.length; i++) {
            let current = blocks[i];
            let nextIndex = (i + 1 < blocks.length) ? blocks[i + 1].index : sourceCode.length;
            let codeBlock = sourceCode.substring(current.index, nextIndex);

            let parameters = {
                path: [],
                query: [],
                body: []
            };

            // Infer path parameters from the URL pattern /users/:id
            const pathSegments = current.path.split('/');
            pathSegments.forEach(seg => {
                if(seg.startsWith(':')) {
                    parameters.path.push({
                        name: seg.substring(1),
                        type: 'string', // Default, AI will refine later
                        required: true
                    });
                }
            });

            // Infer body and query params defined in code block
            let paramMatch;
            this.paramsRegex.lastIndex = 0;
            while ((paramMatch = this.paramsRegex.exec(codeBlock)) !== null) {
                let type = paramMatch[1]; // body, query, params
                let name = paramMatch[2];
                
                // Avoid duplicating path params
                if(type === 'params' && parameters.path.some(p => p.name === name)) {
                    continue;
                }

                // Add to body/query if not already there
                if (!parameters[type].some(p => p.name === name)) {
                    parameters[type].push({
                        name: name,
                        type: this._guessTypeFromName(name),
                        required: type === 'body' // assume body params are required by default
                    });
                }
            }

            endpoints.push({
                id: `ep_${i}`,
                method: current.method,
                path: current.path,
                parameters: parameters,
                // These will be filled by AI Analyzer
                description: '',
                tags: [],
                responses: []
            });
        }

        return endpoints;
    }

    _guessTypeFromName(name) {
        if(name.toLowerCase().includes('id') || name.toLowerCase().includes('count')) return 'integer';
        if(name.toLowerCase().includes('is') || name.toLowerCase().includes('has')) return 'boolean';
        return 'string';
    }
}

window.CodeParser = CodeParser;
