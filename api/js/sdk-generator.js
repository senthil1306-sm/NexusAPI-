/**
 * sdk-generator.js - NexusAPI
 * Generates API Client code in different languages
 */

class SDKGenerator {
    
    generate(language, endpoints) {
        if(!endpoints || endpoints.length === 0) return "// No endpoints found to generate SDK.";

        let code = "";
        
        switch(language) {
            case 'javascript':
                code = this._generateJS(endpoints);
                break;
            case 'python':
                code = this._generatePython(endpoints);
                break;
            case 'java':
                code = this._generateJava(endpoints);
                break;
            default:
                code = "// Language not supported";
        }
        
        return code;
    }

    _generateJS(endpoints) {
        let code = `/**
 * NexusAPI Auto-Generated JS Client
 * Requires Node.js >= 18 for native fetch or browser environment
 */

class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL || 'https://api.example.com';
    }

    async _request(endpoint, options = {}) {
        const url = \`\${this.baseURL}\${endpoint}\`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        options.headers = { ...defaultHeaders, ...options.headers };

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(\`API request failed with status: \${response.status}\`);
        }
        
        // Handle 204 No Content
        if(response.status === 204) return null;
        
        return response.json();
    }
\n`;

        endpoints.forEach((ep) => {
            const funcName = this._createFuncName(ep.method, ep.path);
            const params = this._extractAllParams(ep);
            const paramsSignature = params.length > 0 ? params.join(', ') : '';
            
            let urlReplaced = ep.path;
            ep.parameters.path.forEach(p => {
                urlReplaced = urlReplaced.replace(`:\${p.name}`, `\${${p.name}}`);
            });

            code += `    /**\n`;
            code += `     * ${ep.description}\n`;
            code += `     */\n`;
            code += `    async ${funcName}(${paramsSignature}) {\n`;
            code += `        return this._request(\`${urlReplaced}\`, {\n`;
            code += `            method: '${ep.method}',\n`;
            if(ep.parameters.body.length > 0) {
                // Simplified assumptions for body mapping
                const bodyObj = ep.parameters.body.map(p => p.name).join(', ');
                code += `            body: JSON.stringify({ ${bodyObj} })\n`;
            }
            code += `        });\n`;
            code += `    }\n\n`;
        });

        code += `}\n\nexport default ApiClient;\n`;
        return code;
    }

    _generatePython(endpoints) {
        let code = `\"\"\"
NexusAPI Auto-Generated Python Client
Requires: pip install requests
\"\"\"
import requests
import json

class ApiClient:
    def __init__(self, base_url="https://api.example.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

`;

        endpoints.forEach((ep) => {
            const funcName = this._createFuncName(ep.method, ep.path).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            const params = this._extractAllParams(ep);
            let paramsSignature = ['self']
            if(params.length > 0) {
                paramsSignature = paramsSignature.concat(params);
            }
            const pyParams = paramsSignature.join(', ');

            let urlReplaced = ep.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}'); // transform /users/:id to /users/{id}

            code += `    def ${funcName}(${pyParams}):\n`;
            code += `        \"\"\"\n        ${ep.description}\n        \"\"\"\n`;
            
            code += `        url = f"{self.base_url}${urlReplaced}"\n`;
            
            if(ep.parameters.body.length > 0) {
                const bodyObj = ep.parameters.body.map(p => `"${p.name}": ${p.name}`).join(', ');
                code += `        payload = { ${bodyObj} }\n`;
                code += `        response = self.session.request("${ep.method}", url, json=payload)\n`;
            } else {
                code += `        response = self.session.request("${ep.method}", url)\n`;
            }
            
            code += `        response.raise_for_status()\n`;
            code += `        return response.json() if response.content else None\n\n`;
        });

        return code;
    }

    _generateJava(endpoints) {
        let code = `/**
 * NexusAPI Auto-Generated Java Client
 * Requires: OkHttp3
 */
import okhttp3.*;
import java.io.IOException;

public class ApiClient {
    private final String baseUrl;
    private final OkHttpClient client;
    public static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl != null ? baseUrl : "https://api.example.com";
        this.client = new OkHttpClient();
    }

`;

        endpoints.forEach((ep) => {
            const funcName = this._createFuncName(ep.method, ep.path);
            const params = this._extractAllParams(ep).map(p => `String ${p}`); // Simplifying java types
            const paramsSignature = params.length > 0 ? params.join(', ') : '';

            let urlReplaced = ep.path;
            ep.parameters.path.forEach(p => {
                urlReplaced = urlReplaced.replace(`:${p.name}`, `\" + ${p.name} + \"`);
            });

            code += `    /**\n`;
            code += `     * ${ep.description}\n`;
            code += `     */\n`;
            code += `    public String ${funcName}(${paramsSignature}) throws IOException {\n`;
            code += `        String url = this.baseUrl + "${urlReplaced}";\n`;
            
            if(['POST', 'PUT', 'PATCH'].includes(ep.method)) {
                code += `        // TODO: Build actual JSON payload\n`;
                code += `        String jsonStr = "{}"; \n`;
                code += `        RequestBody body = RequestBody.create(jsonStr, JSON);\n`;
                code += `        Request request = new Request.Builder()\n`;
                code += `            .url(url)\n`;
                code += `            .${ep.method.toLowerCase()}(body)\n`;
                code += `            .build();\n`;
            } else {
                code += `        Request request = new Request.Builder()\n`;
                code += `            .url(url)\n`;
                code += `            .${ep.method.toLowerCase()}()\n`;
                code += `            .build();\n`;
            }
            
            code += `        try (Response response = client.newCall(request).execute()) {\n`;
            code += `            if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);\n`;
            code += `            return response.body().string();\n`;
            code += `        }\n`;
            code += `    }\n\n`;
        });

        code += `}\n`;
        return code;
    }

    _createFuncName(method, path) {
        const parts = path.split('/').filter(p => p && !p.startsWith(':'));
        const action = method.toLowerCase();
        
        let target = 'Data';
        if(parts.length > 0) {
            target = parts[parts.length - 1]; // last segment
            // Capitalize
            target = target.charAt(0).toUpperCase() + target.slice(1);
        }

        const modifier = path.includes(':id') ? 'ById' : '';
        return `${action}${target}${modifier}`;
    }

    _extractAllParams(ep) {
        const all = [];
        ep.parameters.path.forEach(p => all.push(p.name));
        ep.parameters.query.forEach(p => all.push(p.name));
        ep.parameters.body.forEach(p => all.push(p.name));
        return all;
    }
}

window.SDKGenerator = SDKGenerator;
