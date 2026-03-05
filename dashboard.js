        // Mock file system data based on a generic project structure
        const mockFiles = {
            "DeepSeedProject": {
                type: "folder",
                children: {
                    "main.py": { type: "file", ext: "py", content: getDefaultContent("main.py", "py") },
                    "audio_processor.py": { type: "file", ext: "py", content: getDefaultContent("audio_processor.py", "py") },
                    "model.py": { type: "file", ext: "py", content: getDefaultContent("model.py", "py") },
                    "voice_commands.py": { type: "file", ext: "py", content: getDefaultContent("voice_commands.py", "py") },
                    "dream_processor.py": { type: "file", ext: "py", content: getDefaultContent("dream_processor.py", "py") },
                    "flavor_engine.py": { type: "file", ext: "py", content: getDefaultContent("flavor_engine.py", "py") },
                    "tear_trigger.py": { type: "file", ext: "py", content: getDefaultContent("tear_trigger.py", "py") },
                    "therapy_engine.py": { type: "file", ext: "py", content: getDefaultContent("therapy_engine.py", "py") },
                    "media_integration.py": { type: "file", ext: "py", content: getDefaultContent("media_integration.py", "py") },
                    "flavor_echo.py": { type: "file", ext: "py", content: getDefaultContent("flavor_echo.py", "py") },
                    "config": {
                        type: "folder",
                        children: {
                            "config.json": { type: "file", ext: "json", content: getDefaultContent("config.json", "json") }
                        }
                    },
                    "docs": {
                        type: "folder",
                        children: {}
                    },
                    "utils": {
                        type: "folder",
                        children: {
                            "encryption.py": { type: "file", ext: "py", content: getDefaultContent("encryption.py", "py") },
                            "logger.py": { type: "file", ext: "py", content: getDefaultContent("logger.py", "py") },
                            "performance.py": { type: "file", ext: "py", content: getDefaultContent("performance.py", "py") },
                            "installer.py": { type: "file", ext: "py", content: getDefaultContent("installer.py", "py") }
                        }
                    },
                    "ui": {
                        type: "folder",
                        children: {
                            "dashboard.py": { type: "file", ext: "py", content: getDefaultContent("dashboard.py", "py") }
                        }
                    },
                    "tests": {
                        type: "folder",
                        children: {
                            "test_audio.py": { type: "file", ext: "py", content: getDefaultContent("test_audio.py", "py") },
                            "test_model.py": { type: "file", ext: "py", content: getDefaultContent("test_model.py", "py") },
                            "test_voice_commands.py": { type: "file", ext: "py", content: getDefaultContent("test_voice_commands.py", "py") },
                            "test_dream_processor.py": { type: "file", ext: "py", content: getDefaultContent("test_dream_processor.py", "py") },
                            "test_therapy_engine.py": { type: "file", ext: "py", content: getDefaultContent("test_therapy_engine.py", "py") },
                            "test_advanced_features.py": { type: "file", ext: "py", content: getDefaultContent("test_advanced_features.py", "py") },
                            "test_encryption.py": { type: "file", ext: "py", content: getDefaultContent("test_encryption.py", "py") },
                            "test_ui.py": { type: "file", ext: "py", content: getDefaultContent("test_ui.py", "py") },
                            "test_media_integration.py": { type: "file", ext: "py", content: getDefaultContent("test_media_integration.py", "py") },
                            "test_onnx_pipeline.py": { type: "file", ext: "py", content: getDefaultContent("test_onnx_pipeline.py", "py") },
                            "test_antisound.py": { type: "file", ext: "py", content: getDefaultContent("test_antisound.py", "py") }
                        }
                    },
                    "models": {
                        type: "folder",
                        children: {
                            "README.md": { type: "file", ext: "md", content: getDefaultContent("models/README.md", "md") }
                        }
                    },
                    "data": {
                        type: "folder",
                        children: {
                            "clips": { type: "folder", children: {} },
                            "dreams": { type: "folder", children: {} },
                            "therapy": { type: "folder", children: {} },
                            "logs": { type: "folder", children: {} }
                        }
                    },
                    "requirements.txt": { type: "file", ext: "txt", content: getDefaultContent("requirements.txt", "txt") }
                }
            }
        };

        // State
        let currentFile = null; // Canonical project path, e.g. DeepSeedProject/docs/README.md
        let currentFilePath = null;
        let fileTree = JSON.parse(JSON.stringify(mockFiles)); // Deep copy
        let originalFileContents = {};
        let modifiedFiles = new Set();
        let newFiles = new Set();
        let deletedFiles = new Set();
        let basePath = "./DeepSeedProject";
        let importUndoStack = [];
        let docTabs = ['README.md', 'Tasks.md', 'Status.md', 'Roadmap.md', 'RELEASE_NOTES.md', 'CONTRIBUTING.md', 'INSTALL.md'];
        let panelStates = {
            metadata: true,
            comments: true,
            todos: true,
            notes: true
        };
        let importFiles = [];
        let notesCache = {};
        let currentTheme = 'dark';
        let currentParserMode = 'auto';
        let currentMarkdownMode = 'sanitized';
        let deepseekApiKey = '';
        let lastAiResponseText = '';
        let snippetQueue = [];
        let snippetFiles = {};
        let exportedSnippetHashes = new Set();
        let snippetTags = ['TODO', 'Do more research', 'Maybe later', 'Look into this'];
        const DEFAULT_DEEPSEEK_MODEL = 'deepseek-coder';
        const DEFAULT_DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
        const PROJECT_STATE_STORAGE_KEY = 'deepseed_project_state_v1';
        const MAX_IMPORT_UNDO = 20;
        const STORAGE_PREFIX = 'deepseed_';
        const LEGACY_STORAGE_PREFIX = 'mute_';
        const HLJS_THEME_MAP = {
            dark: './node_modules/highlight.js/styles/vs2015.min.css',
            ocean: './node_modules/highlight.js/styles/night-owl.min.css',
            forest: './node_modules/highlight.js/styles/stackoverflow-dark.min.css',
            light: './node_modules/highlight.js/styles/github.min.css'
        };

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            migrateLegacyLocalStorageKeys();
            hydrateProjectState();
            loadDocTabs();
            renderFileTree();
            loadNotes();
            loadAllExtractedData();
            if (Object.keys(originalFileContents).length === 0) {
                captureOriginalContents();
            }
            updateStats();
            updateExportSummary();
            setupImportDropzone();
            initSettingsPanel();
            applyStoredTheme();
            applyStoredParserMode();
            applyStoredMarkdownMode();
            initAiAssistant();
            
            // Auto-save notes every 2 seconds
            setInterval(() => {
                if (currentFile) {
                    saveNotes(false);
                }
            }, 2000);

            window.addEventListener('beforeunload', persistProjectState);
        });

        function migrateLegacyLocalStorageKeys() {
            if (typeof localStorage === 'undefined') return;
            try {
                const exactMap = [
                    { oldKey: 'mute_theme', newKey: 'deepseed_theme' },
                    { oldKey: 'mute_parser_mode', newKey: 'deepseed_parser_mode' },
                    { oldKey: 'mute_markdown_mode', newKey: 'deepseed_markdown_mode' },
                    { oldKey: 'mute_snippet_queue', newKey: 'deepseed_snippet_queue' },
                    { oldKey: 'mute_snippet_files', newKey: 'deepseed_snippet_files' },
                    { oldKey: 'mute_exported_snippet_hashes', newKey: 'deepseed_exported_snippet_hashes' },
                    { oldKey: 'mute_snippet_tags', newKey: 'deepseed_snippet_tags' }
                ];

                exactMap.forEach(({ oldKey, newKey }) => {
                    const existing = localStorage.getItem(newKey);
                    if (existing !== null) return;
                    const legacy = localStorage.getItem(oldKey);
                    if (legacy !== null) {
                        localStorage.setItem(newKey, legacy);
                    }
                });

                const prefixMap = [
                    { oldPrefix: 'mute_notes_', newPrefix: 'deepseed_notes_' },
                    { oldPrefix: 'mute_extracted_', newPrefix: 'deepseed_extracted_' }
                ];

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key) continue;
                    prefixMap.forEach(({ oldPrefix, newPrefix }) => {
                        if (!key.startsWith(oldPrefix)) return;
                        const newKey = newPrefix + key.slice(oldPrefix.length);
                        if (localStorage.getItem(newKey) !== null) return;
                        const value = localStorage.getItem(key);
                        if (value !== null) {
                            localStorage.setItem(newKey, value);
                        }
                    });
                }
            } catch (error) {
                console.warn('Legacy localStorage migration failed:', error);
            }
        }

        function getProjectRootName() {
            const root = Object.keys(fileTree || {})[0];
            return root || 'DeepSeedProject';
        }

        function escapeRegex(value) {
            return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function getProjectRootPrefixRegex() {
            return new RegExp(`^${escapeRegex(getProjectRootName())}\\/?`);
        }

        function stripProjectRoot(projectPath) {
            return toProjectPath(projectPath).replace(getProjectRootPrefixRegex(), '');
        }

        function snapshotProjectState() {
            return {
                fileTree: JSON.parse(JSON.stringify(fileTree)),
                originalFileContents: { ...originalFileContents },
                modifiedFiles: [...modifiedFiles],
                newFiles: [...newFiles],
                deletedFiles: [...deletedFiles],
                basePath,
                currentFile,
                currentFilePath
            };
        }

        function isValidFileTreeShape(tree) {
            if (!tree || typeof tree !== 'object') return false;
            const roots = Object.keys(tree);
            if (roots.length === 0) return false;
            const rootNode = tree[roots[0]];
            return !!(rootNode && rootNode.type === 'folder' && rootNode.children && typeof rootNode.children === 'object');
        }

        function migrateLegacyRootPathsInMap(mapObj, fromRoot, toRoot) {
            const result = {};
            Object.entries(mapObj || {}).forEach(([key, value]) => {
                const migratedKey = String(key || '').replace(new RegExp(`^${escapeRegex(fromRoot)}\\/`), `${toRoot}/`);
                result[migratedKey] = value;
            });
            return result;
        }

        function migrateLegacyRootPathsInList(list, fromRoot, toRoot) {
            return (Array.isArray(list) ? list : []).map(item =>
                String(item || '').replace(new RegExp(`^${escapeRegex(fromRoot)}\\/`), `${toRoot}/`)
            );
        }

        function applyProjectStateSnapshot(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') return false;
            const incomingTree = snapshot.fileTree ? JSON.parse(JSON.stringify(snapshot.fileTree)) : JSON.parse(JSON.stringify(mockFiles));
            if (!isValidFileTreeShape(incomingTree)) {
                return false;
            }

            const incomingRoot = Object.keys(incomingTree)[0];
            const defaultRoot = Object.keys(mockFiles)[0];
            const needsLegacyMigration = incomingRoot === 'Mute' && defaultRoot !== 'Mute';

            let normalizedTree = incomingTree;
            let normalizedOriginals = snapshot.originalFileContents ? { ...snapshot.originalFileContents } : {};
            let normalizedModified = Array.isArray(snapshot.modifiedFiles) ? snapshot.modifiedFiles : [];
            let normalizedNew = Array.isArray(snapshot.newFiles) ? snapshot.newFiles : [];
            let normalizedDeleted = Array.isArray(snapshot.deletedFiles) ? snapshot.deletedFiles : [];
            let normalizedCurrentFile = snapshot.currentFile || null;
            let normalizedCurrentFilePath = snapshot.currentFilePath || normalizedCurrentFile;

            if (needsLegacyMigration) {
                normalizedTree = { [defaultRoot]: normalizedTree[incomingRoot] };
                normalizedOriginals = migrateLegacyRootPathsInMap(normalizedOriginals, incomingRoot, defaultRoot);
                normalizedModified = migrateLegacyRootPathsInList(normalizedModified, incomingRoot, defaultRoot);
                normalizedNew = migrateLegacyRootPathsInList(normalizedNew, incomingRoot, defaultRoot);
                normalizedDeleted = migrateLegacyRootPathsInList(normalizedDeleted, incomingRoot, defaultRoot);
                if (normalizedCurrentFile) {
                    normalizedCurrentFile = String(normalizedCurrentFile).replace(new RegExp(`^${escapeRegex(incomingRoot)}\\/`), `${defaultRoot}/`);
                }
                if (normalizedCurrentFilePath) {
                    normalizedCurrentFilePath = String(normalizedCurrentFilePath).replace(new RegExp(`^${escapeRegex(incomingRoot)}\\/`), `${defaultRoot}/`);
                }
            }

            fileTree = normalizedTree;
            originalFileContents = normalizedOriginals;
            modifiedFiles = new Set(normalizedModified);
            newFiles = new Set(normalizedNew);
            deletedFiles = new Set(normalizedDeleted);
            basePath = String(snapshot.basePath || '').trim() || `./${getProjectRootName()}`;
            currentFile = normalizedCurrentFile;
            currentFilePath = normalizedCurrentFilePath;
            return true;
        }

        function persistProjectState() {
            try {
                const payload = snapshotProjectState();
                payload.importUndoStack = importUndoStack;
                localStorage.setItem(PROJECT_STATE_STORAGE_KEY, JSON.stringify(payload));
            } catch (error) {
                console.warn('Failed to persist project state:', error);
            }
        }

        function hydrateProjectState() {
            const input = document.getElementById('baseFolder');
            try {
                const raw = localStorage.getItem(PROJECT_STATE_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const loaded = applyProjectStateSnapshot(parsed);
                    if (!loaded) {
                        fileTree = JSON.parse(JSON.stringify(mockFiles));
                        originalFileContents = {};
                        modifiedFiles = new Set();
                        newFiles = new Set();
                        deletedFiles = new Set();
                        currentFile = null;
                        currentFilePath = null;
                    }
                    importUndoStack = Array.isArray(parsed.importUndoStack) ? parsed.importUndoStack.slice(0, MAX_IMPORT_UNDO) : [];
                } else {
                    basePath = localStorage.getItem('deepseed_base_path') || basePath;
                    importUndoStack = [];
                }
            } catch (error) {
                importUndoStack = [];
            }

            if (input) {
                input.value = basePath;
            }
        }

        function pushUndoSnapshot() {
            importUndoStack.push(snapshotProjectState());
            if (importUndoStack.length > MAX_IMPORT_UNDO) {
                importUndoStack = importUndoStack.slice(importUndoStack.length - MAX_IMPORT_UNDO);
            }
            persistProjectState();
        }

        function initAiAssistant() {
            const modelInput = document.getElementById('deepseekModelInput');
            const endpointInput = document.getElementById('deepseekEndpointInput');
            if (modelInput) {
                modelInput.value = localStorage.getItem('deepseek_model') || DEFAULT_DEEPSEEK_MODEL;
            }
            if (endpointInput) {
                endpointInput.value = localStorage.getItem('deepseek_endpoint') || DEFAULT_DEEPSEEK_ENDPOINT;
            }

            const sessionKey = sessionStorage.getItem('deepseek_api_key');
            if (sessionKey) {
                deepseekApiKey = sessionKey;
                updateAiAuthStatus('Connected (session key)', false);
                setLoginButtonState('success');
            } else {
                updateAiAuthStatus('Not connected', true);
                setLoginButtonState('neutral');
            }

            snippetQueue = loadSnippetQueue();
            snippetFiles = loadSnippetFiles();
            exportedSnippetHashes = loadExportedSnippetHashes();
            snippetTags = loadSnippetTags();
            updateSnippetStatus();
            renderSnippetQueueList();
            renderSnippetTagButtons();
            syncSnippetTagsInput();

            loadDeepseekConfig();
        }

        function loadSnippetQueue() {
            try {
                const raw = localStorage.getItem('deepseed_snippet_queue');
                return raw ? JSON.parse(raw) : [];
            } catch (error) {
                return [];
            }
        }

        function loadSnippetFiles() {
            try {
                const raw = localStorage.getItem('deepseed_snippet_files');
                return raw ? JSON.parse(raw) : {};
            } catch (error) {
                return {};
            }
        }

        function persistSnippetState() {
            localStorage.setItem('deepseed_snippet_queue', JSON.stringify(snippetQueue));
            localStorage.setItem('deepseed_snippet_files', JSON.stringify(snippetFiles));
            localStorage.setItem('deepseed_exported_snippet_hashes', JSON.stringify([...exportedSnippetHashes]));
            localStorage.setItem('deepseed_snippet_tags', JSON.stringify(snippetTags));
        }

        function updateSnippetStatus() {
            const statusEl = document.getElementById('snippetStatus');
            if (!statusEl) return;
            const fileCount = Object.keys(snippetFiles).length;
            statusEl.textContent = `Snippets queued: ${snippetQueue.length} | files: ${fileCount}`;
        }

        function loadExportedSnippetHashes() {
            try {
                const raw = localStorage.getItem('deepseed_exported_snippet_hashes');
                const list = raw ? JSON.parse(raw) : [];
                return new Set(Array.isArray(list) ? list : []);
            } catch (error) {
                return new Set();
            }
        }

        function normalizeSnippetTags(tagsInput) {
            const list = Array.isArray(tagsInput)
                ? tagsInput
                : String(tagsInput || '').split(/,|\n/);

            const cleaned = [];
            const seen = new Set();
            list.forEach(tag => {
                const value = String(tag || '').trim();
                if (!value) return;
                const key = value.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                cleaned.push(value);
            });

            return cleaned.slice(0, 30);
        }

        function loadSnippetTags() {
            try {
                const raw = localStorage.getItem('deepseed_snippet_tags');
                if (!raw) return [...snippetTags];
                const parsed = JSON.parse(raw);
                const normalized = normalizeSnippetTags(parsed);
                return normalized.length > 0 ? normalized : [...snippetTags];
            } catch (error) {
                return [...snippetTags];
            }
        }

        function renderSnippetTagButtons() {
            const container = document.getElementById('snippetTagButtons');
            if (!container) return;
            container.innerHTML = '';
            snippetTags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'small-btn';
                btn.textContent = tag;
                btn.addEventListener('click', () => bookmarkSelectedSnippet(tag));
                container.appendChild(btn);
            });
        }

        function syncSnippetTagsInput() {
            const input = document.getElementById('snippetTagsInput');
            if (!input) return;
            input.value = snippetTags.join(', ');
        }

        function saveSnippetTagsFromSettings() {
            const input = document.getElementById('snippetTagsInput');
            if (!input) return;
            const normalized = normalizeSnippetTags(input.value);
            if (normalized.length === 0) {
                setStatus('Provide at least one snippet tag', true);
                return;
            }
            snippetTags = normalized;
            persistSnippetState();
            renderSnippetTagButtons();
            syncSnippetTagsInput();
            setStatus(`Saved ${snippetTags.length} snippet tags`);
        }

        function resetExportedSnippetHashes() {
            if (!confirm('Reset dedupe history for exported snippets?')) return;
            exportedSnippetHashes = new Set();
            persistSnippetState();
            setStatus('Snippet dedupe history cleared');
        }

        function snippetHash(snippet) {
            const keyword = (snippet.keyword || '').trim().toLowerCase();
            const text = (snippet.text || '').trim().replace(/\s+/g, ' ');
            return `${keyword}||${text}`;
        }

        function ensureSnippetId(snippet) {
            if (!snippet.id) {
                snippet.id = `snip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            }
            return snippet.id;
        }

        function renderSnippetQueueList() {
            const container = document.getElementById('snippetQueueList');
            if (!container) return;
            container.innerHTML = '';

            if (snippetQueue.length === 0) {
                const empty = document.createElement('div');
                empty.style.color = '#777';
                empty.style.fontSize = '0.8rem';
                empty.textContent = 'No queued snippets.';
                container.appendChild(empty);
                return;
            }

            snippetQueue.forEach((snippet, index) => {
                ensureSnippetId(snippet);
                const wrapper = document.createElement('div');
                wrapper.className = 'snippet-item';
                wrapper.innerHTML = `
                    <div class="snippet-item-header">
                        <input class="snippet-keyword-input" value="${escapeHtml(snippet.keyword || '')}" data-role="keyword">
                        <button class="small-btn" data-role="remove">Delete</button>
                    </div>
                    <textarea class="snippet-text-input" data-role="text">${escapeHtml(snippet.text || '')}</textarea>
                `;

                const keywordInput = wrapper.querySelector('[data-role="keyword"]');
                const textInput = wrapper.querySelector('[data-role="text"]');
                const removeBtn = wrapper.querySelector('[data-role="remove"]');

                keywordInput.addEventListener('change', (e) => {
                    snippetQueue[index].keyword = e.target.value.trim() || 'Uncategorized';
                    persistSnippetState();
                    updateSnippetStatus();
                });

                textInput.addEventListener('change', (e) => {
                    snippetQueue[index].text = e.target.value.trim();
                    persistSnippetState();
                    updateSnippetStatus();
                });

                removeBtn.addEventListener('click', () => {
                    snippetQueue.splice(index, 1);
                    persistSnippetState();
                    updateSnippetStatus();
                    renderSnippetQueueList();
                });

                container.appendChild(wrapper);
            });
        }

        function getSnippetDateStamp(dateObj = new Date()) {
            return dateObj.toISOString().slice(0, 10);
        }

        function bookmarkSelectedSnippet(keyword) {
            const outputEl = document.getElementById('aiResponseOutput');
            if (!outputEl) return;
            const finalKeyword = (keyword || '').trim();
            if (!finalKeyword) {
                setStatus('Snippet keyword is required', true);
                return;
            }
            const start = outputEl.selectionStart;
            const end = outputEl.selectionEnd;
            if (typeof start !== 'number' || typeof end !== 'number' || end <= start) {
                setStatus('Select text in AI response before bookmarking', true);
                return;
            }

            const selected = outputEl.value.slice(start, end).trim();
            if (!selected) {
                setStatus('Selected text is empty', true);
                return;
            }

            const snippet = {
                keyword: finalKeyword,
                text: selected,
                createdAt: new Date().toISOString(),
                source: 'DeepSeek Assistant'
            };
            ensureSnippetId(snippet);
            snippetQueue.push(snippet);
            persistSnippetState();
            updateSnippetStatus();
            renderSnippetQueueList();
            setStatus(`Bookmarked snippet as "${finalKeyword}"`);
        }

        function bookmarkSelectedSnippetFromInput() {
            const input = document.getElementById('customSnippetKeyword');
            if (!input) return;
            const keyword = input.value.trim();
            if (!keyword) {
                setStatus('Enter a custom keyword first', true);
                return;
            }
            bookmarkSelectedSnippet(keyword);
            input.value = '';
        }

        function renderSnippetMarkdown(entries) {
            const lines = [];
            entries.forEach((entry, idx) => {
                lines.push(`## Snippet ${idx + 1}`);
                lines.push(`- Keyword: ${entry.keyword}`);
                lines.push(`- Time: ${entry.createdAt}`);
                lines.push(`- Source: ${entry.source}`);
                lines.push('');
                lines.push('```text');
                lines.push(entry.text);
                lines.push('```');
                lines.push('');
            });
            return lines.join('\n');
        }

        function exportSnippets() {
            if (snippetQueue.length === 0) {
                setStatus('No queued snippets to export', true);
                return;
            }

            const date = getSnippetDateStamp();
            const filename = `Snippets_${date}.md`;
            const header = `# Snippets ${date}\n\n`;
            const existing = snippetFiles[filename] || header;
            const uniqueForExport = [];
            const seen = new Set();

            snippetQueue.forEach(snippet => {
                const hash = snippetHash(snippet);
                if (seen.has(hash) || exportedSnippetHashes.has(hash)) return;
                seen.add(hash);
                exportedSnippetHashes.add(hash);
                uniqueForExport.push(snippet);
            });

            if (uniqueForExport.length === 0) {
                snippetQueue = [];
                persistSnippetState();
                updateSnippetStatus();
                renderSnippetQueueList();
                setStatus('No new unique snippets to export');
                return;
            }

            const body = renderSnippetMarkdown(uniqueForExport);
            snippetFiles[filename] = existing.endsWith('\n\n') ? `${existing}${body}` : `${existing}\n\n${body}`;

            snippetQueue = [];
            persistSnippetState();
            updateSnippetStatus();
            renderSnippetQueueList();
            setStatus(`Exported ${uniqueForExport.length} snippets to ${filename}`);
        }

        function downloadSnippets() {
            const entries = Object.entries(snippetFiles || {});
            if (entries.length === 0) {
                setStatus('No snippet files to download', true);
                return;
            }
            if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
                setStatus('ZIP export libraries are unavailable', true);
                return;
            }

            const zip = new JSZip();
            entries.forEach(([filename, content]) => {
                zip.file(filename, content);
            });
            zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            }).then(content => {
                saveAs(content, `snippets_${getSnippetDateStamp()}.zip`);
                setStatus(`Downloaded ${entries.length} snippet files`);
            }).catch(error => {
                console.error('Snippet ZIP error:', error);
                setStatus('Error exporting snippet zip', true);
            });
        }

        async function loadDeepseekConfig() {
            try {
                const response = await fetch('./settings.config', { cache: 'no-store' });
                if (!response.ok) return;
                const text = await response.text();
                const parsed = parseSettingsConfig(text);
                if (!parsed) return;

                const modelInput = document.getElementById('deepseekModelInput');
                const endpointInput = document.getElementById('deepseekEndpointInput');

                if (parsed.model && modelInput) {
                    modelInput.value = parsed.model;
                    localStorage.setItem('deepseek_model', parsed.model);
                }
                if (parsed.endpoint && endpointInput) {
                    endpointInput.value = parsed.endpoint;
                    localStorage.setItem('deepseek_endpoint', parsed.endpoint);
                }
                if (parsed.snippetTags && parsed.snippetTags.length > 0 && !localStorage.getItem('deepseed_snippet_tags')) {
                    snippetTags = normalizeSnippetTags(parsed.snippetTags);
                    persistSnippetState();
                    renderSnippetTagButtons();
                    syncSnippetTagsInput();
                }
                if (parsed.apiKey && !deepseekApiKey) {
                    deepseekApiKey = parsed.apiKey;
                    updateAiAuthStatus('Connected (settings.config)', false);
                    setLoginButtonState('success');
                }
            } catch (error) {
                // settings.config is optional; do nothing on failure
            }
        }

        function parseSettingsConfig(rawText) {
            if (!rawText || !rawText.trim()) return null;
            const text = rawText.trim();

            try {
                if (text.startsWith('{')) {
                    const obj = JSON.parse(text);
                    return {
                        apiKey: obj.DEEPSEEK_API_KEY || obj.deepseek_api_key || obj.apiKey || '',
                        model: obj.DEEPSEEK_MODEL || obj.deepseek_model || obj.model || '',
                        endpoint: obj.DEEPSEEK_ENDPOINT || obj.deepseek_endpoint || obj.endpoint || '',
                        snippetTags: normalizeSnippetTags(obj.SNIPPET_TAGS || obj.snippet_tags || obj.snippetTags || [])
                    };
                }
            } catch (error) {
                // Fall through to KEY=VALUE parser
            }

            const result = { apiKey: '', model: '', endpoint: '', snippetTags: [] };
            text.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const idx = trimmed.indexOf('=');
                if (idx < 0) return;
                const key = trimmed.slice(0, idx).trim().toUpperCase();
                const value = trimmed.slice(idx + 1).trim();
                if (key === 'DEEPSEEK_API_KEY') result.apiKey = value;
                if (key === 'DEEPSEEK_MODEL') result.model = value;
                if (key === 'DEEPSEEK_ENDPOINT') result.endpoint = value;
                if (key === 'SNIPPET_TAGS') result.snippetTags = normalizeSnippetTags(value);
            });
            return result;
        }

        function updateAiAuthStatus(message, isError) {
            const el = document.getElementById('aiAuthStatus');
            if (!el) return;
            el.textContent = message;
            el.style.color = isError ? '#f48771' : '#9cdcfe';
        }

        function setLoginButtonState(state) {
            const btn = document.getElementById('deepseekLoginBtn');
            if (!btn) return;
            btn.classList.remove('login-success', 'login-failed');
            if (state === 'success') btn.classList.add('login-success');
            if (state === 'failed') btn.classList.add('login-failed');
        }

        function toggleAiPanel() {
            const panel = document.getElementById('aiPanel');
            if (!panel) return;
            panel.classList.toggle('active');
        }

        function connectDeepseek() {
            const keyInput = document.getElementById('deepseekApiKeyInput');
            if (!keyInput) return;
            const typed = keyInput.value.trim();
            if (!typed && !deepseekApiKey) {
                updateAiAuthStatus('Missing API key', true);
                setLoginButtonState('failed');
                return;
            }

            if (typed) {
                deepseekApiKey = typed;
                sessionStorage.setItem('deepseek_api_key', typed);
            }

            const modelInput = document.getElementById('deepseekModelInput');
            const endpointInput = document.getElementById('deepseekEndpointInput');
            if (modelInput && modelInput.value.trim()) {
                localStorage.setItem('deepseek_model', modelInput.value.trim());
            }
            if (endpointInput && endpointInput.value.trim()) {
                localStorage.setItem('deepseek_endpoint', endpointInput.value.trim());
            }

            updateAiAuthStatus('Connected', false);
            setLoginButtonState('success');
            setStatus('DeepSeek login set for this session');
        }

        function clearDeepseekSession() {
            deepseekApiKey = '';
            lastAiResponseText = '';
            sessionStorage.removeItem('deepseek_api_key');
            const keyInput = document.getElementById('deepseekApiKeyInput');
            if (keyInput) keyInput.value = '';
            updateAiAuthStatus('Not connected', true);
            setLoginButtonState('neutral');
            setStatus('DeepSeek session cleared');
        }

        function setAiBusy(isBusy) {
            const askBtn = document.getElementById('aiAskBtn');
            const askParseBtn = document.getElementById('aiAskParseBtn');
            if (askBtn) askBtn.disabled = isBusy;
            if (askParseBtn) askParseBtn.disabled = isBusy;
        }

        function getApiErrorPresentation(statusCode, detailText) {
            const detail = String(detailText || '').trim();
            const suffix = detail ? `\n${detail.slice(0, 500)}` : '';
            if (statusCode === 401) {
                return {
                    auth: 'Unauthorized (401): check API key',
                    status: 'DeepSeek auth failed (401)',
                    output: `Request failed (401 Unauthorized): API key is invalid or expired.${suffix}`
                };
            }
            if (statusCode === 402) {
                return {
                    auth: 'Billing issue (402): insufficient balance',
                    status: 'DeepSeek billing issue (402)',
                    output: `Request failed (402): account has insufficient balance/quota.${suffix}`
                };
            }
            if (statusCode === 429) {
                return {
                    auth: 'Rate limited (429): retry shortly',
                    status: 'DeepSeek rate limited (429)',
                    output: `Request failed (429): rate limit reached. Retry with backoff.${suffix}`
                };
            }
            if (statusCode >= 500 && statusCode <= 599) {
                return {
                    auth: `DeepSeek server error (${statusCode})`,
                    status: `DeepSeek server error (${statusCode})`,
                    output: `Request failed (${statusCode}): DeepSeek service error. Retry shortly.${suffix}`
                };
            }
            return {
                auth: `Request failed (${statusCode})`,
                status: `DeepSeek request failed (${statusCode})`,
                output: `Request failed (${statusCode}).${suffix}`
            };
        }

        async function askDeepseek(autoParse) {
            const promptEl = document.getElementById('aiPromptInput');
            const outputEl = document.getElementById('aiResponseOutput');
            const modelInput = document.getElementById('deepseekModelInput');
            const endpointInput = document.getElementById('deepseekEndpointInput');
            if (!promptEl || !outputEl || !modelInput || !endpointInput) return;

            const prompt = promptEl.value.trim();
            if (!prompt) {
                setStatus('AI prompt is empty', true);
                return;
            }

            if (!deepseekApiKey) {
                const keyInput = document.getElementById('deepseekApiKeyInput');
                if (keyInput && keyInput.value.trim()) {
                    connectDeepseek();
                }
            }
            if (!deepseekApiKey) {
                updateAiAuthStatus('Missing API key', true);
                setLoginButtonState('failed');
                setStatus('Please login with a DeepSeek API key', true);
                return;
            }

            const model = modelInput.value.trim() || DEFAULT_DEEPSEEK_MODEL;
            const endpoint = endpointInput.value.trim() || DEFAULT_DEEPSEEK_ENDPOINT;
            localStorage.setItem('deepseek_model', model);
            localStorage.setItem('deepseek_endpoint', endpoint);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            setAiBusy(true);
            outputEl.value = 'Waiting for DeepSeek response...';

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekApiKey}`
                    },
                    body: JSON.stringify({
                        model,
                        temperature: 0.2,
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    const errText = await response.text();
                    const apiError = new Error(`HTTP ${response.status}: ${errText.slice(0, 400)}`);
                    apiError.httpStatus = response.status;
                    apiError.httpBody = errText;
                    throw apiError;
                }

                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
                if (!content) {
                    throw new Error('Empty response content');
                }

                lastAiResponseText = content;
                outputEl.value = content;
                updateAiAuthStatus('Connected', false);
                setLoginButtonState('success');
                setStatus(`DeepSeek response received (${content.length} chars)`);

                if (autoParse) {
                    parseLastAiResponse();
                }
            } catch (error) {
                clearTimeout(timeout);
                if (error && error.name === 'AbortError') {
                    outputEl.value = 'Request failed:\nRequest timed out after 60 seconds.';
                    setStatus('DeepSeek request timed out', true);
                    updateAiAuthStatus('Request timed out', true);
                    setLoginButtonState('failed');
                    return;
                }

                const statusCode = Number(error && error.httpStatus);
                if (Number.isFinite(statusCode) && statusCode > 0) {
                    const view = getApiErrorPresentation(statusCode, error.httpBody || error.message || '');
                    outputEl.value = view.output;
                    setStatus(view.status, true);
                    updateAiAuthStatus(view.auth, true);
                } else {
                    outputEl.value = `Request failed:\n${error.message}`;
                    setStatus('DeepSeek request failed', true);
                    updateAiAuthStatus('Request failed', true);
                }
                setLoginButtonState('failed');
            } finally {
                setAiBusy(false);
            }
        }

        function parseLastAiResponse() {
            const outputEl = document.getElementById('aiResponseOutput');
            const responseText = outputEl ? outputEl.value.trim() : '';
            if (!responseText) {
                setStatus('No AI response available to parse', true);
                return;
            }
            lastAiResponseText = responseText;
            showImportModal();
            const importText = document.getElementById('importText');
            if (importText) {
                importText.value = responseText;
            }
            parseImport();
        }

        function setupImportDropzone() {
            const dropzone = document.querySelector('.file-upload-area');
            if (!dropzone) return;

            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'));
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'));
            });

            dropzone.addEventListener('drop', (e) => {
                const files = e.dataTransfer && e.dataTransfer.files;
                if (!files || files.length === 0) return;
                handleFileUpload({ target: { files } });
            });
        }

        function getDefaultContent(filename, ext) {
            if (ext === 'py') {
                return `#!/usr/bin/env python3\n# File: ${filename}\n# Version: 1.0.0\n# Sprint: Unknown\n# Last Updated: 2026-03-04\n\n"""\n${filename} module\n"""\n\nimport os\nimport sys\n\ndef main():\n    """Main function"""\n    pass\n\nif __name__ == "__main__":\n    main()\n`;
            } else if (ext === 'md') {
                return `# ${filename}\n\n## Overview\n\nThis is the ${filename} documentation.\n\n## Details\n\nContent goes here.\n`;
            } else if (ext === 'json') {
                return `{\n    "name": "deepseed-project",\n    "version": "2.0.0",\n    "description": "DeepSeed Project"\n}\n`;
            } else {
                return `# ${filename}\n\nContent for ${filename}\n`;
            }
        }

        function toProjectPath(path) {
            if (!path) return getProjectRootName();
            let normalized = path.replace(/\\/g, '/').trim();
            normalized = normalized.replace(/^\.?\//, '');
            const root = getProjectRootName();
            if (normalized.startsWith('Mute/')) {
                normalized = `${root}/${normalized.slice('Mute/'.length)}`;
            }
            if (!normalized.startsWith(root)) {
                normalized = `${root}/${normalized}`;
            }
            return normalized.replace(/\/+/g, '/').replace(/\/$/, '');
        }

        function toDisplayPath(projectPath) {
            const relPath = stripProjectRoot(projectPath);
            return `${basePath}/${relPath}`.replace(/\/+/g, '/');
        }

        function getFilenameFromPath(path) {
            const parts = toProjectPath(path).split('/');
            return parts[parts.length - 1] || '';
        }

        function captureOriginalContents() {
            // Capture original content for all files
            const capture = (node, path) => {
                if (node.type === 'file') {
                    const fullPath = toProjectPath(path);
                    originalFileContents[fullPath] = node.content;
                } else if (node.type === 'folder' && node.children) {
                    Object.entries(node.children).forEach(([name, child]) => {
                        child.name = name;
                        capture(child, path ? `${path}/${name}` : name);
                    });
                }
            };
            
            Object.entries(fileTree).forEach(([name, node]) => {
                node.name = name;
                capture(node, name);
            });
        }

        function loadDocTabs() {
            const tabsContainer = document.getElementById('docTabs');
            tabsContainer.innerHTML = '';
            
            docTabs.forEach(doc => {
                const tab = document.createElement('span');
                tab.className = 'doc-tab';
                tab.textContent = doc;
                tab.onclick = () => loadDocument(doc);
                tabsContainer.appendChild(tab);
            });
        }

        function renderFileTree() {
            const treeContainer = document.getElementById('fileTree');
            treeContainer.innerHTML = '';
            
            Object.entries(fileTree).forEach(([name, node]) => {
                node.name = name;
                renderNode(name, node, treeContainer, 0, '');
            });
            
            // Update file count
            const count = countAllFiles(fileTree[getProjectRootName()]);
            document.getElementById('fileCount').textContent = `${count} files`;
            updateStats();
            updateExportSummary();
        }

        function renderNode(name, node, container, depth, parentPath) {
            const currentPath = parentPath ? `${parentPath}/${name}` : name;
            if (node.type === 'folder') {
                renderFolder(name, node, container, depth, currentPath);
            } else {
                renderFile(name, node, container, depth, currentPath);
            }
        }

        function renderFolder(name, folder, container, depth, folderPath) {
            // Count modified and new files in this folder
            const folderStats = countFolderChanges(folder, folderPath);
            
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-header';
            folderHeader.style.paddingLeft = `${depth * 1 + 1}rem`;
            
            let folderStatus = '';
            if (folderStats.modified > 0 || folderStats.new > 0) {
                folderStatus = `<span class="folder-status">(${folderStats.modified + folderStats.new} changes)</span>`;
            }
            
            folderHeader.innerHTML = `<span class="arrow">▼</span> 📁 ${name} ${folderStatus}`;
            
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'folder-children expanded';
            
            folderHeader.onclick = (e) => {
                e.stopPropagation();
                const arrow = folderHeader.querySelector('.arrow');
                if (childrenDiv.classList.contains('expanded')) {
                    childrenDiv.classList.remove('expanded');
                    arrow.textContent = '▶';
                } else {
                    childrenDiv.classList.add('expanded');
                    arrow.textContent = '▼';
                }
            };
            
            container.appendChild(folderHeader);
            container.appendChild(childrenDiv);
            
            // Sort children: folders first, then files
            const entries = Object.entries(folder.children || {});
            const folders = entries.filter(([_, data]) => data.type === 'folder');
            const files = entries.filter(([_, data]) => data.type === 'file');
            
            [...folders, ...files].forEach(([childName, childData]) => {
                childData.name = childName;
                renderNode(childName, childData, childrenDiv, depth + 1, folderPath);
            });
        }

        function countFolderChanges(folder, currentPath) {
            let modified = 0;
            let new_count = 0;
            
            const count = (node, path) => {
                if (node.type === 'file') {
                    const fullPath = toProjectPath(path);
                    if (modifiedFiles.has(fullPath)) modified++;
                    if (newFiles.has(fullPath)) new_count++;
                } else if (node.type === 'folder' && node.children) {
                    Object.entries(node.children).forEach(([name, child]) => {
                        child.name = name;
                        count(child, `${path}/${name}`);
                    });
                }
            };
            
            count(folder, currentPath);
            return { modified, new: new_count };
        }

        function renderFile(name, file, container, depth, fullPath) {
            const fileDiv = document.createElement('div');
            const projectPath = toProjectPath(fullPath);
            const isModified = modifiedFiles.has(projectPath);
            const isNew = newFiles.has(projectPath);
            
            let statusClass = '';
            let statusText = '';
            
            if (isNew) {
                statusClass = 'status-new';
                statusText = '🆕 New';
            } else if (isModified) {
                statusClass = 'status-modified';
                statusText = '📝 Modified';
            }
            
            fileDiv.className = `file-item ${getFileClass(file.ext)} ${isNew ? 'new' : ''} ${isModified ? 'modified' : ''}`;
            fileDiv.style.paddingLeft = `${depth * 1 + 2}rem`;
            fileDiv.setAttribute('data-filename', name);
            fileDiv.setAttribute('data-filepath', projectPath);
            fileDiv.setAttribute('data-filenode', JSON.stringify({name, ext: file.ext}));
            
            const icon = getFileIcon(file.ext);
            
            fileDiv.innerHTML = `
                <span class="file-icon">${icon}</span>
                <span class="file-name">${name}</span>
                ${statusText ? `<span class="file-status ${statusClass}">${statusText}</span>` : ''}
            `;
            
            fileDiv.onclick = () => {
                loadFile(name, file.ext, projectPath, file);
            };
            
            container.appendChild(fileDiv);
        }

        function getFileIcon(ext) {
            const icons = {
                'py': '🐍',
                'md': '📘',
                'json': '📋',
                'txt': '📄',
                'default': '📄'
            };
            return icons[ext] || icons.default;
        }

        function getFileClass(ext) {
            const classes = {
                'py': 'python',
                'md': 'markdown',
                'txt': 'text',
                'json': 'text'
            };
            return classes[ext] || '';
        }

        function countAllFiles(folder) {
            let count = 0;
            if (!folder || !folder.children) return 0;
            
            const entries = Object.values(folder.children || {});
            entries.forEach(entry => {
                if (entry.type === 'file') {
                    count++;
                } else if (entry.type === 'folder') {
                    count += countAllFiles(entry);
                }
            });
            return count;
        }

        function loadFile(filename, ext, filepath, fileNode) {
            const projectPath = toProjectPath(filepath);
            currentFile = projectPath;
            currentFilePath = projectPath;
            
            // Update UI
            document.querySelectorAll('.file-item').forEach(el => {
                el.classList.remove('active');
                if (el.getAttribute('data-filepath') === projectPath) {
                    el.classList.add('active');
                }
            });
            
            if (fileNode) {
                displayFileContent(fileNode.content, ext, filename);
                extractMetadata(fileNode.content, filename, toDisplayPath(projectPath), ext, projectPath);
            }
            
            loadNotes();
            loadExtractedData(projectPath);
            updateChangeStats(filename, fileNode);
            
            setStatus(`Loaded ${filename}`);
        }

        function findFileNodeByPath(projectPath) {
            const normalized = toProjectPath(projectPath);
            const parts = normalized.split('/').filter(Boolean);
            if (parts.length === 0) return null;
            
            let current = fileTree[parts[0]];
            if (!current) return null;
            
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (!current.children || !current.children[part]) {
                    return null;
                }
                current = current.children[part];
            }
            
            return current.type === 'file' ? current : null;
        }

        function sanitizeRenderedHtml(html) {
            const template = document.createElement('template');
            template.innerHTML = html;
            const blockedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'style'];

            blockedTags.forEach(tag => {
                template.content.querySelectorAll(tag).forEach(node => node.remove());
            });

            template.content.querySelectorAll('*').forEach(node => {
                [...node.attributes].forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const attrValue = (attr.value || '').trim().toLowerCase();

                    if (attrName.startsWith('on') || attrName === 'srcdoc') {
                        node.removeAttribute(attr.name);
                        return;
                    }

                    if (['href', 'src', 'xlink:href'].includes(attrName)) {
                        if (attrValue.startsWith('javascript:') || attrValue.startsWith('data:text/html')) {
                            node.removeAttribute(attr.name);
                        }
                    }
                });
            });
            
            return template.innerHTML;
        }

        function initSettingsPanel() {
            const panel = document.getElementById('settingsPanel');
            const button = document.getElementById('settingsBtn');
            if (!panel || !button) return;

            document.addEventListener('click', (e) => {
                if (!panel.classList.contains('active')) return;
                if (panel.contains(e.target) || button.contains(e.target)) return;
                hideSettingsPanel();
            });
        }

        function applyStoredTheme() {
            const stored = localStorage.getItem('deepseed_theme') || 'dark';
            applyTheme(stored, false);
        }

        function applyStoredParserMode() {
            const stored = localStorage.getItem('deepseed_parser_mode') || 'auto';
            applyParserMode(stored, false);
        }

        function applyStoredMarkdownMode() {
            const stored = localStorage.getItem('deepseed_markdown_mode') || 'sanitized';
            applyMarkdownMode(stored, false);
        }

        function applyCodeTheme(themeName) {
            const link = document.getElementById('hljsThemeLink');
            if (!link) return;
            const href = HLJS_THEME_MAP[themeName] || HLJS_THEME_MAP.dark;
            if (link.getAttribute('href') !== href) {
                link.setAttribute('href', href);
            }
        }

        function applyTheme(themeName, announce = true) {
            const validThemes = ['dark', 'ocean', 'forest', 'light'];
            const normalized = validThemes.includes(themeName) ? themeName : 'dark';

            validThemes.forEach(t => document.body.classList.remove(`theme-${t}`));
            document.body.classList.add(`theme-${normalized}`);
            applyCodeTheme(normalized);
            currentTheme = normalized;
            localStorage.setItem('deepseed_theme', normalized);

            const selector = document.getElementById('themeSelect');
            if (selector && selector.value !== normalized) {
                selector.value = normalized;
            }

            if (announce) {
                setStatus(`Theme changed to ${normalized}`);
            }
        }

        function applyParserMode(mode, announce = true) {
            const validModes = ['auto', 'marker_v1', 'diff_v1'];
            const normalized = validModes.includes(mode) ? mode : 'auto';
            currentParserMode = normalized;
            localStorage.setItem('deepseed_parser_mode', normalized);

            const selector = document.getElementById('parserModeSelect');
            if (selector && selector.value !== normalized) {
                selector.value = normalized;
            }

            if (announce) {
                setStatus(`Parser mode set to ${normalized}`);
            }
        }

        function applyMarkdownMode(mode, announce = true) {
            const validModes = ['sanitized', 'strict'];
            const normalized = validModes.includes(mode) ? mode : 'sanitized';
            currentMarkdownMode = normalized;
            localStorage.setItem('deepseed_markdown_mode', normalized);

            const selector = document.getElementById('markdownModeSelect');
            if (selector && selector.value !== normalized) {
                selector.value = normalized;
            }

            if (announce) {
                setStatus(`Markdown safety mode set to ${normalized}`);
                refreshCurrentFile();
            }
        }

        function toggleSettingsPanel() {
            const panel = document.getElementById('settingsPanel');
            if (!panel) return;
            panel.classList.toggle('active');
        }

        function hideSettingsPanel() {
            const panel = document.getElementById('settingsPanel');
            if (!panel) return;
            panel.classList.remove('active');
        }

        function displayFileContent(content, ext, filename) {
            const viewer = document.getElementById('fileViewer');
            
            if (ext === 'md') {
                if (currentMarkdownMode === 'strict') {
                    viewer.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(content)}</pre>`;
                    return;
                }

                if (typeof marked === 'undefined') {
                    viewer.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(content)}</pre>`;
                    setStatus('Markdown parser unavailable; showing plain text', true);
                    return;
                }

                const rendered = marked.parse(content);
                viewer.innerHTML = `<div class="markdown-body">${sanitizeRenderedHtml(rendered)}</div>`;
                if (typeof hljs !== 'undefined') {
                    viewer.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
            } else if (ext === 'py') {
                if (typeof hljs !== 'undefined') {
                    const highlighted = hljs.highlight('python', content).value;
                    viewer.innerHTML = `<pre class="python-code"><code class="python">${highlighted}</code></pre>`;
                } else {
                    viewer.innerHTML = `<pre class="python-code"><code class="python">${escapeHtml(content)}</code></pre>`;
                }
            } else {
                viewer.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap;">${escapeHtml(content)}</pre>`;
            }
        }

        function loadDocument(docName) {
            const ext = docName.split('.').pop();
            const projectPath = `${getProjectRootName()}/docs/${docName}`;
            const fileNode = findFileNodeByPath(projectPath);
            if (fileNode) {
                loadFile(docName, ext, projectPath, fileNode);
            }
            
            document.querySelectorAll('.doc-tab').forEach(el => {
                if (el.textContent === docName) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });
        }

        function extractMetadata(content, filename, filepath, ext, projectPath = null) {
            const fileMatch = content.match(/# File:\s*(.+)$/m);
            const versionMatch = content.match(/# Version:\s*(.+)$/m);
            const sprintMatch = content.match(/# Sprint:\s*(.+)$/m);
            const updatedMatch = content.match(/# Last Updated:\s*(.+)$/m);
            
            document.getElementById('meta-filename').textContent = fileMatch ? fileMatch[1].trim() : filename;
            document.getElementById('meta-path').textContent = filepath;
            document.getElementById('meta-version').textContent = versionMatch ? versionMatch[1].trim() : 'Unknown';
            document.getElementById('meta-sprint').textContent = sprintMatch ? sprintMatch[1].trim() : 'Unknown';
            document.getElementById('meta-updated').textContent = updatedMatch ? updatedMatch[1].trim() : 'Unknown';
            document.getElementById('meta-type').textContent = ext.toUpperCase();
            
            // Extract comments and TODOs
            const lines = content.split('\n');
            const commentLines = [];
            const todoLines = [];
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#')) {
                    if (trimmed.includes('TODO:') || trimmed.includes('FIXME:') || trimmed.includes('HACK:')) {
                        todoLines.push(trimmed);
                    } else if (!trimmed.match(/^#!\s*/) && 
                              !trimmed.match(/# File:/) && 
                              !trimmed.match(/# Version:/) && 
                              !trimmed.match(/# Sprint:/) && 
                              !trimmed.match(/# Last Updated:/)) {
                        commentLines.push(trimmed);
                    }
                }
            });
            
            document.getElementById('comments-display').innerHTML = commentLines.length > 0 
                ? commentLines.map(c => `<div class="comment-item">${escapeHtml(c)}</div>`).join('')
                : '<div style="color: #666; padding: 0.5rem;">No comments found</div>';
            document.getElementById('comment-count').textContent = commentLines.length;
            
            document.getElementById('todos-display').innerHTML = todoLines.length > 0
                ? todoLines.map(t => `<div class="todo-item"><span class="todo-prefix">🔧</span> ${escapeHtml(t)}</div>`).join('')
                : '<div style="color: #666; padding: 0.5rem;">No TODOs found</div>';
            document.getElementById('todo-count').textContent = todoLines.length;
            
            // Save extracted data
            const extractedData = {
                filename: fileMatch ? fileMatch[1].trim() : filename,
                filepath: filepath,
                version: versionMatch ? versionMatch[1].trim() : 'Unknown',
                sprint: sprintMatch ? sprintMatch[1].trim() : 'Unknown',
                lastUpdated: updatedMatch ? updatedMatch[1].trim() : 'Unknown',
                fileType: ext.toUpperCase(),
                comments: commentLines,
                todos: todoLines
            };
            
            const key = projectPath ? toProjectPath(projectPath) : filename;
            localStorage.setItem(`deepseed_extracted_${key}`, JSON.stringify(extractedData));
        }

        function loadExtractedData(fileKey) {
            const key = toProjectPath(fileKey);
            const data = localStorage.getItem(`deepseed_extracted_${key}`);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    document.getElementById('meta-filename').textContent = parsed.filename || '-';
                    document.getElementById('meta-path').textContent = parsed.filepath || '-';
                    document.getElementById('meta-version').textContent = parsed.version || '-';
                    document.getElementById('meta-sprint').textContent = parsed.sprint || '-';
                    document.getElementById('meta-updated').textContent = parsed.lastUpdated || '-';
                    document.getElementById('meta-type').textContent = parsed.fileType || '-';
                    
                    if (parsed.comments) {
                        document.getElementById('comments-display').innerHTML = parsed.comments.length > 0
                            ? parsed.comments.map(c => `<div class="comment-item">${escapeHtml(c)}</div>`).join('')
                            : '<div style="color: #666; padding: 0.5rem;">No comments found</div>';
                        document.getElementById('comment-count').textContent = parsed.comments.length;
                    }
                    
                    if (parsed.todos) {
                        document.getElementById('todos-display').innerHTML = parsed.todos.length > 0
                            ? parsed.todos.map(t => `<div class="todo-item"><span class="todo-prefix">🔧</span> ${escapeHtml(t)}</div>`).join('')
                            : '<div style="color: #666; padding: 0.5rem;">No TODOs found</div>';
                        document.getElementById('todo-count').textContent = parsed.todos.length;
                    }
                } catch (e) {
                    console.warn('Failed to parse extracted metadata for', key, e);
                }
            }
        }

        function loadAllExtractedData() {
            if (currentFile) {
                loadExtractedData(currentFile);
            }
        }

        function loadNotes() {
            if (!currentFile) return;
            const notes = localStorage.getItem(`deepseed_notes_${currentFile}`);
            document.getElementById('notesText').value = notes || '';
            notesCache[currentFile] = notes || '';
        }

        function saveNotes(showStatus = true) {
            if (!currentFile) return;
            const notes = document.getElementById('notesText').value;
            if (notesCache[currentFile] === notes) return;
            localStorage.setItem(`deepseed_notes_${currentFile}`, notes);
            notesCache[currentFile] = notes;
            if (showStatus) {
                setStatus(`Notes saved for ${currentFile}`);
            }
        }

        function clearNotes() {
            if (!currentFile) return;
            if (confirm('Clear all notes for this file?')) {
                localStorage.removeItem(`deepseed_notes_${currentFile}`);
                document.getElementById('notesText').value = '';
                notesCache[currentFile] = '';
                setStatus('Notes cleared');
            }
        }

        function exportNotes() {
            if (!currentFile) return;
            const notes = document.getElementById('notesText').value;
            if (!notes) {
                alert('No notes to export');
                return;
            }
            
            const blob = new Blob([notes], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${getFilenameFromPath(currentFile)}_notes.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function updateStats() {
            const total = countAllFiles(fileTree[getProjectRootName()]);
            const modified = modifiedFiles.size;
            const newF = newFiles.size;
            const deleted = deletedFiles.size;
            const unchanged = total - modified - newF;
            
            document.getElementById('totalFiles').textContent = total;
            document.getElementById('unchangedFiles').textContent = Math.max(0, unchanged);
            document.getElementById('modifiedFiles').textContent = modified;
            document.getElementById('newFiles').textContent = newF;
            const deletedEl = document.getElementById('deletedFiles');
            if (deletedEl) deletedEl.textContent = deleted;
            
            checkSaveButton();
        }

        function updateExportSummary() {
            const totalChanges = modifiedFiles.size + newFiles.size + deletedFiles.size;
            const summary = document.getElementById('exportSummary');
            const countSpan = document.getElementById('exportCount');
            
            if (totalChanges > 0) {
                summary.style.display = 'block';
                countSpan.textContent = totalChanges;
            } else {
                summary.style.display = 'none';
            }
        }

        function updateChangeStats(filename, fileNode) {
            if (!fileNode) return;
            
            const fullPath = toProjectPath(currentFilePath);
            const original = originalFileContents[fullPath] || '';
            const current = fileNode.content || '';
            
            const originalLines = original.split('\n');
            const currentLines = current.split('\n');
            
            // Simple diff stats
            let added = 0;
            let deleted = 0;
            
            if (originalLines.length !== currentLines.length) {
                if (currentLines.length > originalLines.length) {
                    added = currentLines.length - originalLines.length;
                } else {
                    deleted = originalLines.length - currentLines.length;
                }
            }
            
            // Count changed lines (simplified)
            let changed = 0;
            for (let i = 0; i < Math.min(originalLines.length, currentLines.length); i++) {
                if (originalLines[i] !== currentLines[i]) {
                    changed++;
                }
            }
            
            const statsDiv = document.getElementById('changeStats');
            statsDiv.innerHTML = `
                <div class="stat-item stat-added">➕ +${added}</div>
                <div class="stat-item stat-deleted">➖ -${deleted}</div>
                <div class="stat-item stat-changed">📝 ${changed} lines changed</div>
            `;
        }

        function checkSaveButton() {
            const saveBtn = document.getElementById('saveChangesBtn');
            const totalChanges = modifiedFiles.size + newFiles.size + deletedFiles.size;
            if (totalChanges > 0) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `💾 Save Changes (${totalChanges})`;
            } else {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '💾 Save Changes';
            }
        }

        function downloadZip() {
            const totalChanges = modifiedFiles.size + newFiles.size + deletedFiles.size;
            if (totalChanges === 0) {
                setStatus('No changes to save', true);
                return;
            }

            if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
                setStatus('ZIP export libraries are unavailable', true);
                return;
            }
            
            const zip = new JSZip();
            let fileCount = 0;
            
            // Recursively add changed files to zip
            const addChangedFiles = (node, path) => {
                if (node.type === 'file') {
                    const fullPath = toProjectPath(path);
                    
                    // Check if this file should be included
                    if (modifiedFiles.has(fullPath) || newFiles.has(fullPath)) {
                        const filePath = stripProjectRoot(fullPath);
                        zip.file(filePath, node.content);
                        fileCount++;
                    }
                } else if (node.type === 'folder' && node.children) {
                    Object.entries(node.children).forEach(([name, child]) => {
                        child.name = name;
                        addChangedFiles(child, path ? `${path}/${name}` : name);
                    });
                }
            };
            
            // Start from root
            Object.entries(fileTree).forEach(([name, node]) => {
                node.name = name;
                addChangedFiles(node, '');
            });

            if (deletedFiles.size > 0) {
                const deletionManifest = [
                    '# Deleted files',
                    ...[...deletedFiles].map(path => stripProjectRoot(path))
                ].join('\n');
                zip.file('_DELETIONS.txt', deletionManifest);
                fileCount++;
            }
            
            if (fileCount === 0) {
                setStatus('No changed files to export', true);
                return;
            }
            
            // Generate and download
            setStatus(`Creating ZIP with ${fileCount} files...`);
            
            zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            }).then(content => {
                saveAs(content, `deepseed_changes_${new Date().toISOString().slice(0,10)}.zip`);
                setStatus(`✅ Exported ${fileCount} changed files`);
            }).catch(error => {
                console.error('Zip error:', error);
                setStatus('❌ Error creating zip file', true);
            });
        }

        function showImportModal() {
            document.getElementById('importModal').classList.add('active');
            document.getElementById('importText').value = '';
            document.getElementById('importResults').style.display = 'none';
            document.getElementById('importConfirmBtn').disabled = true;
            document.getElementById('fileInput').value = '';
            importFiles = [];
        }

        function hideImportModal() {
            document.getElementById('importModal').classList.remove('active');
        }

        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('importText').value = e.target.result;
                parseImport();
            };
            reader.readAsText(file);
        }

        function parseImport() {
            const text = document.getElementById('importText').value;
            const files = [];
            const parserAvailable = !!(window.DeepseekParser && (typeof window.DeepseekParser.parseImport === 'function' || typeof window.DeepseekParser.parseImportText === 'function'));
            const parsedResult = (window.DeepseekParser && typeof window.DeepseekParser.parseImport === 'function')
                ? window.DeepseekParser.parseImport(text, {
                    preferredFormat: currentParserMode,
                    getFileContent: (filepath) => {
                        const node = findFileNodeByPath(toProjectPath(filepath));
                        return node && node.type === 'file' ? node.content : null;
                    },
                    strict: true
                })
                : { files: (window.DeepseekParser && typeof window.DeepseekParser.parseImportText === 'function') ? window.DeepseekParser.parseImportText(text) : [] };
            const parsedFiles = parsedResult.files || [];
            const parseErrors = parsedResult.errors || [];
            const parseWarnings = parsedResult.warnings || [];

            if (parseWarnings.length > 0) {
                console.warn('Import parser warnings:', parseWarnings);
            }

            parsedFiles.forEach(entry => {
                const projectPath = toProjectPath(entry.filepath);
                const fileNode = findFileNodeByPath(projectPath);
                const exists = !!fileNode;
                const op = entry.op || 'upsert';
                
                let status = 'new';
                let changes = null;
                
                if (op === 'delete') {
                    status = exists ? 'delete' : 'same';
                } else if (op === 'create') {
                    status = exists ? (fileNode.content === entry.content ? 'same' : 'update') : 'new';
                } else if (op === 'modify') {
                    status = exists ? (fileNode.content === entry.content ? 'same' : 'update') : 'new';
                } else if (exists) {
                    if (fileNode.content === entry.content) {
                        status = 'same';
                    } else {
                        status = 'update';
                        const oldLines = fileNode.content.split('\n');
                        const newLines = entry.content.split('\n');
                        changes = {
                            added: Math.max(0, newLines.length - oldLines.length),
                            deleted: Math.max(0, oldLines.length - newLines.length)
                        };
                    }
                }

                if (status === 'update' && exists && !changes) {
                    const oldLines = fileNode.content.split('\n');
                    const newLines = entry.content.split('\n');
                    changes = {
                        added: Math.max(0, newLines.length - oldLines.length),
                        deleted: Math.max(0, oldLines.length - newLines.length)
                    };
                }
                
                files.push({
                    filename: entry.filename,
                    filepath: entry.filepath,
                    folderPath: entry.folderPath,
                    content: entry.content,
                    ext: entry.ext,
                    op,
                    exists,
                    status,
                    changes,
                    selected: status !== 'same'
                });
            });
            
            if (files.length > 0) {
                importFiles = files;
                displayImportResults();
                document.getElementById('importResults').style.display = 'block';
                updateImportConfirmState();
                if (parsedResult.parser && parsedResult.version) {
                    let msg = `Parsed ${files.length} files via ${parsedResult.parser}@${parsedResult.version}`;
                    if (parseErrors.length > 0) {
                        msg += ` (${parseErrors.length} errors)`;
                    } else if (parseWarnings.length > 0) {
                        msg += ` (${parseWarnings.length} warnings)`;
                    }
                    setStatus(msg, parseErrors.length > 0);
                }
                if (parseErrors.length > 0) {
                    alert(`Import parse completed with ${parseErrors.length} errors:\n- ${parseErrors.slice(0, 3).join('\n- ')}`);
                }
            } else {
                if (!parserAvailable) {
                    alert('Parser module unavailable (deepseek-parser.js)');
                } else {
                    if (parseErrors.length > 0) {
                        alert(`No importable files. Parser errors:\n- ${parseErrors.slice(0, 5).join('\n- ')}`);
                        setStatus('Import parse failed', true);
                    } else {
                        alert('No files found for the selected parser mode');
                    }
                }
            }
        }

        function updateImportConfirmState() {
            const selectedCount = importFiles.filter(f => f.selected).length;
            const btn = document.getElementById('importConfirmBtn');
            if (!btn) return;
            btn.disabled = selectedCount === 0;
            btn.textContent = selectedCount > 0 ? `Import Selected (${selectedCount})` : 'Import Selected';
        }

        function setImportSelection(mode) {
            importFiles.forEach(file => {
                if (mode === 'all') {
                    file.selected = true;
                } else if (mode === 'changed') {
                    file.selected = file.status !== 'same';
                } else {
                    file.selected = false;
                }
            });
            displayImportResults();
            updateImportConfirmState();
        }

        function displayImportResults() {
            const listDiv = document.getElementById('importList');
            listDiv.innerHTML = '';
            
            importFiles.forEach((file, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'import-item';
                
                let statusClass = 'status-same';
                let statusText = 'Unchanged';
                
                if (file.status === 'new') {
                    statusClass = 'status-new';
                    statusText = 'New File';
                } else if (file.status === 'update') {
                    statusClass = 'status-update';
                    statusText = `Update (+${file.changes.added}/-${file.changes.deleted})`;
                } else if (file.status === 'delete') {
                    statusClass = 'status-delete';
                    statusText = 'Delete';
                }
                
                itemDiv.innerHTML = `
                    <input type="checkbox" ${file.selected ? 'checked' : ''} data-index="${index}">
                    <span class="import-path">${file.folderPath ? file.folderPath + '/' : ''}</span>
                    <span class="import-filename">${file.filename}</span>
                    <span class="import-status ${statusClass}">${statusText}</span>
                `;
                
                const checkbox = itemDiv.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    file.selected = e.target.checked;
                    updateImportConfirmState();
                });
                
                listDiv.appendChild(itemDiv);
            });
            updateImportConfirmState();
        }

        function confirmImport() {
            const selectedFiles = importFiles.filter(f => f.selected);
            if (selectedFiles.length === 0) {
                setStatus('No selected files to import', true);
                return;
            }
            pushUndoSnapshot();
            let imported = 0;
            let updated = 0;
            let removed = 0;
            
            selectedFiles.forEach(file => {
                // Check if file already exists
                const projectPath = toProjectPath(file.filepath);
                const existingNode = findFileNodeByPath(projectPath);

                if (file.op === 'delete') {
                    if (existingNode && removeFileNodeByPath(projectPath)) {
                        deletedFiles.add(projectPath);
                        modifiedFiles.delete(projectPath);
                        newFiles.delete(projectPath);
                        removed++;
                    }
                    return;
                }
                
                if (existingNode) {
                    // Update existing file
                    existingNode.content = file.content;
                    deletedFiles.delete(projectPath);
                    
                    // Mark as modified if content changed
                    if (originalFileContents[projectPath] !== file.content) {
                        modifiedFiles.add(projectPath);
                        
                        // If it was new before, it's now modified
                        if (newFiles.has(projectPath)) {
                            newFiles.delete(projectPath);
                        }
                    } else {
                        modifiedFiles.delete(projectPath);
                    }
                    updated++;
                } else {
                    // Create new file in appropriate folder
                    const relativePath = stripProjectRoot(projectPath);
                    const pathParts = relativePath.split('/');
                    const newFilename = pathParts.pop();
                    let current = fileTree[getProjectRootName()];
                    
                    // Navigate to/create folders
                    for (const part of pathParts) {
                        if (!current.children[part]) {
                            current.children[part] = {
                                type: 'folder',
                                children: {},
                                name: part
                            };
                        }
                        current = current.children[part];
                    }
                    
                    // Add the file
                    current.children[newFilename] = {
                        type: 'file',
                        ext: file.ext,
                        content: file.content,
                        name: newFilename
                    };
                    
                    newFiles.add(projectPath);
                    deletedFiles.delete(projectPath);
                    imported++;
                }
            });
            
            renderFileTree();
            updateStats();
            updateExportSummary();
            persistProjectState();
            
            hideImportModal();
            setStatus(`Imported ${imported} new files, updated ${updated} files, deleted ${removed} files`);
        }

        function removeFileNodeByPath(projectPath) {
            const normalized = toProjectPath(projectPath);
            const parts = normalized.split('/').filter(Boolean);
            if (parts.length < 2) return false;

            let current = fileTree[parts[0]];
            if (!current || current.type !== 'folder') return false;

            for (let i = 1; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current.children || !current.children[part]) return false;
                current = current.children[part];
            }

            const leaf = parts[parts.length - 1];
            if (!current.children || !current.children[leaf]) return false;
            delete current.children[leaf];
            return true;
        }

        function loadFileTree() {
            const path = document.getElementById('baseFolder').value;
            basePath = String(path || '').trim() || `./${getProjectRootName()}`;
            localStorage.setItem('deepseed_base_path', basePath);
            
            renderFileTree();
            persistProjectState();
            setStatus(`Loaded project from ${path}`);
        }

        function undoLastImport() {
            if (importUndoStack.length === 0) {
                setStatus('No import to undo', true);
                return;
            }
            const snapshot = importUndoStack.pop();
            applyProjectStateSnapshot(snapshot);
            const baseInput = document.getElementById('baseFolder');
            if (baseInput) baseInput.value = basePath;
            renderFileTree();
            updateStats();
            updateExportSummary();
            refreshCurrentFile();
            persistProjectState();
            setStatus('Undo successful');
        }

        function toggleSection(section) {
            panelStates[section] = !panelStates[section];
            const content = document.getElementById(`${section}-content`);
            const arrow = document.getElementById(`${section}-arrow`);
            
            if (panelStates[section]) {
                content.classList.add('expanded');
                arrow.textContent = '▼';
            } else {
                content.classList.remove('expanded');
                arrow.textContent = '▶';
            }
        }

        function refreshCurrentFile() {
            if (!currentFile) return;
            const filename = getFilenameFromPath(currentFile);
            const ext = filename.split('.').pop();
            const fileNode = findFileNodeByPath(currentFile);
            if (fileNode) {
                loadFile(filename, ext, currentFilePath, fileNode);
            }
        }

        function collectAllProjectFilePaths() {
            const paths = new Set();
            const walk = (node, path) => {
                if (!node) return;
                if (node.type === 'file') {
                    paths.add(toProjectPath(path));
                    return;
                }
                if (node.type === 'folder' && node.children) {
                    Object.entries(node.children).forEach(([name, child]) => {
                        child.name = name;
                        walk(child, path ? `${path}/${name}` : name);
                    });
                }
            };

            Object.entries(fileTree).forEach(([name, node]) => {
                node.name = name;
                walk(node, name);
            });

            return paths;
        }

        function runSelfCheck() {
            const allPaths = collectAllProjectFilePaths();
            const changedPaths = new Set([...modifiedFiles, ...newFiles].map(p => toProjectPath(p)));
            const missingChanged = [];
            const undeletedPaths = [];
            const duplicateChanged = changedPaths.size !== (modifiedFiles.size + newFiles.size);

            changedPaths.forEach(path => {
                if (!allPaths.has(path)) {
                    missingChanged.push(path);
                }
            });

            deletedFiles.forEach(path => {
                const normalized = toProjectPath(path);
                if (allPaths.has(normalized)) {
                    undeletedPaths.push(normalized);
                }
            });

            const exportCandidates = [...changedPaths].filter(path => allPaths.has(path));
            const lines = [];
            lines.push(`changed_total=${changedPaths.size}`);
            lines.push(`deleted_total=${deletedFiles.size}`);
            lines.push(`files_in_tree=${allPaths.size}`);
            lines.push(`export_candidates=${exportCandidates.length}`);
            lines.push(`missing_changed_keys=${missingChanged.length}`);
            lines.push(`undeleted_keys=${undeletedPaths.length}`);

            if (duplicateChanged) {
                lines.push('warning: overlapping keys detected between modified/new sets');
            }

            if (missingChanged.length > 0) {
                lines.push('missing_paths:');
                missingChanged.slice(0, 10).forEach(path => lines.push(` - ${path}`));
                if (missingChanged.length > 10) {
                    lines.push(` ... +${missingChanged.length - 10} more`);
                }
            }

            if (undeletedPaths.length > 0) {
                lines.push('undeleted_paths:');
                undeletedPaths.slice(0, 10).forEach(path => lines.push(` - ${path}`));
                if (undeletedPaths.length > 10) {
                    lines.push(` ... +${undeletedPaths.length - 10} more`);
                }
            }

            const panel = document.getElementById('selfCheckPanel');
            if (!panel) return;

            panel.style.display = 'block';
            panel.classList.remove('ok', 'error');

            if (missingChanged.length === 0 && undeletedPaths.length === 0) {
                panel.classList.add('ok');
                panel.textContent = `SELF-CHECK OK\n${lines.join('\n')}`;
                setStatus('Self-check passed');
            } else {
                panel.classList.add('error');
                panel.textContent = `SELF-CHECK FAILED\n${lines.join('\n')}`;
                setStatus('Self-check found path mismatches', true);
            }
        }

        function setStatus(message, isError = false) {
            const statusEl = document.getElementById('statusMessage');
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.style.color = isError ? '#f48771' : '#9cdcfe';
            }
            
            // Clear after 3 seconds for non-error messages
            if (!isError) {
                setTimeout(() => {
                    if (statusEl && statusEl.textContent === message) {
                        statusEl.textContent = 'Ready';
                        statusEl.style.color = '#9cdcfe';
                    }
                }, 3000);
            }
        }

        function escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    
