/**
 * ui.js - NexusAPI
 * Handles DOM interactions and view updates
 */

class UIController {
    constructor(endpoints = []) {
        this.endpoints = endpoints;
        this.currentSdkLanguage = 'javascript';
        this.setupEventListeners();
    }

    setEndpoints(endpoints) {
        this.endpoints = endpoints;
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if(item.classList.contains('disabled')) return;
                
                // Active state
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                // Switch view
                const target = item.getAttribute('data-target');
                document.querySelectorAll('.view-section').forEach(v => {
                    v.classList.remove('active');
                    v.classList.add('hidden');
                });
                const view = document.getElementById(target);
                view.classList.remove('hidden');
                view.classList.add('active', 'blur-in');
            });
        });

        // SDK Tabs
        document.querySelectorAll('.sdk-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.sdk-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentSdkLanguage = tab.getAttribute('data-lang');
                
                // Dispatch event to app.js to regenerate SDK code string
                document.dispatchEvent(new CustomEvent('sdkLanguageChanged', { detail: this.currentSdkLanguage }));
            });
        });

        // Copy SDK code
        document.getElementById('btnCopySdk').addEventListener('click', () => {
            const code = document.getElementById('sdkCodeView').textContent;
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('btnCopySdk');
                btn.innerHTML = '<i data-lucide="check" style="color: #10b981;"></i>';
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="copy"></i>';
                    lucide.createIcons();
                }, 2000);
            });
        });
        
        // Try it out interaction delegated in list
    }

    enableNav() {
        document.getElementById('nav-explorer').classList.remove('disabled');
        document.getElementById('nav-docs').classList.remove('disabled');
        document.getElementById('nav-sdk').classList.remove('disabled');
    }

    renderExplorer() {
        const container = document.getElementById('endpointContainer');
        container.innerHTML = '';
        
        this.endpoints.forEach((ep) => {
            const el = document.createElement('div');
            el.className = 'ep-item';
            el.setAttribute('data-id', ep.id);
            el.innerHTML = `
                <span class="ep-method ${ep.method.toLowerCase()}">${ep.method}</span>
                <span class="ep-path">${ep.path}</span>
            `;
            el.addEventListener('click', () => this.selectEndpoint(ep.id));
            container.appendChild(el);
        });

        // Select first by default if exists
        if(this.endpoints.length > 0) {
            this.selectEndpoint(this.endpoints[0].id);
        }
    }

    selectEndpoint(id) {
        document.querySelectorAll('.ep-item').forEach(item => {
            item.classList.remove('selected');
            if(item.getAttribute('data-id') === id) item.classList.add('selected');
        });

        const ep = this.endpoints.find(e => e.id === id);
        if(!ep) return;

        const details = document.getElementById('endpointDetails');
        
        let paramsHtml = '';
        const allParams = [...ep.parameters.path, ...ep.parameters.query, ...ep.parameters.body];
        
        if (allParams.length > 0) {
            let rows = allParams.map(p => `
                <tr>
                    <td>${p.name} <span style="color:red">${p.required ? '*' : ''}</span></td>
                    <td><span class="type-badge">${p.type}</span></td>
                    <td>${p.description}</td>
                </tr>
            `).join('');

            paramsHtml = `
            <div class="param-section">
                <h4><i data-lucide="list"></i> Parameters</h4>
                <table class="param-table">
                    <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        } else {
            paramsHtml = `<p style="color: var(--text-secondary); margin-bottom: 1.5rem;">No parameters required.</p>`;
        }

        // Try it out section
        let tryItHtml = `<div class="try-it-box">
            <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="play"></i> Try it out
            </h4>
        `;
        
        allParams.forEach(p => {
            tryItHtml += `
                <div class="input-group">
                    <label>${p.name} ${p.required ? '*' : ''}</label>
                    <input type="text" placeholder="Enter ${p.name}" id="input_${p.name}" />
                </div>
            `;
        });
        
        tryItHtml += `<button class="btn btn-primary" style="margin-top: 15px; width: 100%; justify-content: center;" onclick="window.UI.executeMockRequest('${ep.id}')">Send Request</button>`;
        
        tryItHtml += `<div id="response_${ep.id}" style="display: none;" class="response-block"></div>`;
        tryItHtml += `</div>`;

        details.innerHTML = `
            <div class="details-header blur-in">
                <div class="details-title">
                    <span class="ep-method ${ep.method.toLowerCase()}">${ep.method}</span>
                    <h3>${ep.path}</h3>
                </div>
                <p class="ep-desc">${ep.description}</p>
            </div>
            <div class="blur-in" style="animation-delay: 0.1s">
                ${paramsHtml}
            </div>
            <div class="blur-in" style="animation-delay: 0.2s">
                ${tryItHtml}
            </div>
        `;
        lucide.createIcons();
    }

    executeMockRequest(id) {
        const ep = this.endpoints.find(e => e.id === id);
        const btn = document.querySelector(`#endpointDetails .btn-primary`);
        btn.innerHTML = `<span class="loader-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span> Sending...`;

        setTimeout(() => {
            btn.innerHTML = 'Send Request';
            const resBox = document.getElementById(`response_${id}`);
            resBox.style.display = 'block';
            
            const schemaStr = ep.schemaMock ? JSON.stringify(ep.schemaMock, null, 2) : 'No Content (204)';
            const status = ep.schemaMock ? '200 OK' : '204 No Content';

            resBox.innerHTML = `
                <div class="status-badge">${status}</div>
                <pre>${schemaStr}</pre>
            `;
        }, 800);
    }

    renderDocs() {
        const container = document.getElementById('docsContainer');
        let mdHtml = '';

        this.endpoints.forEach(ep => {
            mdHtml += `<div style="margin-bottom: 2rem;">`;
            mdHtml += `<h2><span class="ep-method ${ep.method.toLowerCase()}" style="font-size: 0.9rem; margin-right: 10px;">${ep.method}</span> ${ep.path}</h2>`;
            mdHtml += `<p>${ep.description}</p>`;
            
            mdHtml += `<h3>Responses</h3>`;
            ep.responses.forEach(r => {
                let badgeColor = r.status >= 400 ? 'red' : (r.status >= 300 ? 'orange' : 'green');
                mdHtml += `<p><strong style="color:${badgeColor}">${r.status}</strong> - ${r.desc}</p>`;
            });

            if (ep.schemaMock) {
                mdHtml += `<h3>Expected Model</h3>`;
                mdHtml += `<pre><code>${JSON.stringify(ep.schemaMock, null, 2)}</code></pre>`;
            }
            mdHtml += `</div><hr style="border-color: var(--border-color); margin: 2rem 0;">`;
        });

        container.innerHTML = mdHtml;
    }

    renderSdk(code) {
        document.getElementById('sdkCodeView').textContent = code;
    }
}

window.UIController = UIController;
