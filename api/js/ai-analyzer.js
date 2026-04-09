/**
 * ai-analyzer.js - NexusAPI
 * Simulates LLM inference to generate readable descriptions, schemas, and responses
 */

class AIAnalyzer {
    async analyze(endpoints) {
        // Simulating network delay for AI processing
        return new Promise((resolve) => {
            setTimeout(() => {
                const enriched = endpoints.map(ep => this._enrichEndpoint(ep));
                resolve(enriched);
            }, 2500); // 2.5 second simulation
        });
    }

    _enrichEndpoint(ep) {
        // AI Logic: Deduce purpose based on method and path string
        const resourceMatch = ep.path.match(/\/([a-zA-Z_-]+)/);
        const resource = resourceMatch ? resourceMatch[1] : 'resource';
        const TargetId = ep.path.includes(':id') ? ' by ID' : '';

        // Generate Descriptions
        switch(ep.method) {
            case 'GET':
                ep.description = `Retrieves information about ${resource}${TargetId}. Returns a JSON object containing the requested details.`;
                ep.responses = [
                    { status: 200, desc: `Successfully retrieved ${resource}` },
                    { status: 404, desc: `${resource} not found` }
                ];
                break;
            case 'POST':
                ep.description = `Creates a new ${resource} entity using the provided payload. Validates the required fields before creation.`;
                ep.responses = [
                    { status: 201, desc: `Successfully created ${resource}` },
                    { status: 400, desc: `Validation error or bad request` }
                ];
                break;
            case 'PUT':
            case 'PATCH':
                ep.description = `Updates an existing ${resource}${TargetId}. Only provided fields will be modified.`;
                ep.responses = [
                    { status: 200, desc: `Successfully updated ${resource}` },
                    { status: 404, desc: `${resource} not found` },
                    { status: 400, desc: `Invalid data provided` }
                ];
                break;
            case 'DELETE':
                ep.description = `Permanently deletes the specified ${resource}${TargetId} from the system. Warning: this cannot be undone.`;
                ep.responses = [
                    { status: 204, desc: `Successfully deleted ${resource}` },
                    { status: 404, desc: `${resource} not found` },
                    { status: 403, desc: `Insufficient permissions to delete` }
                ];
                break;
        }

        // Add Mock AI Rules to Parameters
        ['query', 'body', 'path'].forEach(type => {
            ep.parameters[type].forEach(param => {
                if(!param.description) {
                    param.description = this._generateParamDesc(param.name, resource);
                }
            });
        });

        // Generate schema model mock
        ep.schemaMock = this._generateMockResponse(resource, ep.method);

        return ep;
    }

    _generateParamDesc(name, resource) {
        if(name.toLowerCase() === 'id') return `Unique identifier for the ${resource}.`;
        if(name.toLowerCase() === 'limit') return `Maximum number of records to return.`;
        if(name.toLowerCase() === 'page') return `Pagination offset or page number.`;
        if(name.toLowerCase() === 'email') return `Valid email address formatting required.`;
        return `Value representing the ${name} for the ${resource}.`;
    }

    _generateMockResponse(resource, method) {
        if(method === 'DELETE') return null;
        
        // Mock a JSON object response
        let obj = {
            id: 'uuidv4-string',
            createdAt: new Date().toISOString()
        };

        if(resource === 'users') {
            obj.name = "John Doe";
            obj.email = "john@example.com";
            obj.role = "admin";
        } else if (resource === 'products') {
            obj.title = "Wireless Headphones";
            obj.price = 99.99;
            obj.inStock = true;
        } else {
            obj.data = `Sample ${resource} data`;
        }

        return obj;
    }
}

window.AIAnalyzer = AIAnalyzer;
