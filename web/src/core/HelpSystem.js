
const readmeModules = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });

export class HelpSystem {
    static getHelpContent(generatorDisplayName) {
        // Map Display Name or Class Name to Filename
        // Files are like Readme_CirclePackingGenerator.md
        // Generators have display names like "Circle Packing". 
        // We might need a map or normalize the name. 
        // But better: use the generator's class name if possible, or try to match.
        // Let's assume we pass the simpler "Id" or we just search.

        // Let's try to match loosely.
        const normalized = generatorDisplayName.replace(/[^a-zA-Z]/g, '');

        for (const path in readmeModules) {
            // path is like "../docs/Readme_CirclePackingGenerator.md"
            if (path.toLowerCase().includes(normalized.toLowerCase())) {
                return this.parseMarkdown(readmeModules[path]);
            }
        }

        return `<h1>No Help Found</h1><p>Could not find documentation for ${generatorDisplayName}</p>`;
    }

    static parseMarkdown(md) {
        if (!md) return "";

        let html = '<div class="markdown-body">';
        const lines = md.split('\n');
        let inTable = false;
        let inList = false;

        for (let line of lines) {
            line = line.trim();

            // Headers
            if (line.startsWith('# ')) {
                html += `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('## ')) {
                html += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('### ')) {
                html += `<h3>${line.substring(4)}</h3>`;
            }
            // List Items
            else if (line.startsWith('* ') || line.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                html += `<li>${this.processInline(line.substring(2))}</li>`;
            }
            // End List if not a list item
            else if (inList && !line.startsWith('* ') && !line.startsWith('- ') && line.length > 0) {
                html += '</ul>';
                inList = false;
                html += `<p>${this.processInline(line)}</p>`;
            }
            // Table
            else if (line.startsWith('|')) {
                if (!inTable) {
                    html += '<table class="help-table">';
                    inTable = true;
                }
                if (line.includes('---')) continue;

                html += '<tr>';
                const cells = line.split('|').filter(c => c.length > 0);
                cells.forEach(cell => {
                    html += `<td>${this.processInline(cell.trim())}</td>`;
                });
                html += '</tr>';
            }
            // End Table
            else if (inTable && !line.startsWith('|')) {
                html += '</table>';
                inTable = false;
            }
            // Empty Lines
            else if (line.length === 0) {
                if (inList) { html += '</ul>'; inList = false; }
                if (inTable) { html += '</table>'; inTable = false; }
            }
            // Paragraphs
            else {
                html += `<p>${this.processInline(line)}</p>`;
            }
        }

        if (inList) html += '</ul>';
        if (inTable) html += '</table>';

        html += '</div>';
        return html;
    }

    static processInline(text) {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        // Links
        text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        // Math/LaTeX (Simple replacement for now)
        text = text.replace(/\$/g, '');
        return text;
    }
}
