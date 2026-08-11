
const readmeModules = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });
const HELP_DESCRIPTOR_SUFFIXES = ['fractal', 'generator'];

export class HelpSystem {
    static getHelpContent(generatorDisplayName) {
        const path = this.getHelpPath(generatorDisplayName);
        if (path) {
            return this.parseMarkdown(readmeModules[path]);
        }

        return `<h1>No Help Found</h1><p>Could not find documentation for ${generatorDisplayName}</p>`;
    }

    static getHelpPath(generatorDisplayName) {
        const candidates = this.getHelpNameCandidates(generatorDisplayName);

        for (const path in readmeModules) {
            const normalizedPath = this.normalizeHelpDocPath(path);
            if (candidates.includes(normalizedPath)) {
                return path;
            }
        }

        return null;
    }

    static getHelpNameCandidates(generatorDisplayName) {
        const withoutParenthetical = generatorDisplayName.replace(/\([^)]*\)/g, ' ');
        const withoutTrailingDescriptor = withoutParenthetical.split(/\s+-\s+/)[0];
        const normalized = this.normalizeHelpName(generatorDisplayName);
        const base = this.normalizeHelpName(withoutTrailingDescriptor);
        const singular = base.endsWith('s') ? base.slice(0, -1) : base;
        const withoutKnownSuffixes = HELP_DESCRIPTOR_SUFFIXES.reduce((value, suffix) => {
            return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
        }, base);
        return Array.from(new Set([normalized, base, singular, withoutKnownSuffixes].filter(Boolean)));
    }

    static normalizeHelpDocPath(path) {
        const filename = path.split('/').at(-1) ?? path;
        const stem = filename.replace(/\.md$/i, '');
        return this.normalizeHelpName(stem)
            .replace(/^readme/, '')
            .replace(/generator$/, '');
    }

    static normalizeHelpName(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z]/g, '')
            .toLowerCase();
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
