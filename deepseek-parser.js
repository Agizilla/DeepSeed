(function (global) {
    "use strict";

    function normalizePath(rawPath) {
        return (rawPath || "").replace(/\\/g, "/").trim();
    }

    function parsePathInfo(filepath) {
        const pathParts = filepath.split("/").filter(Boolean);
        const filename = pathParts[pathParts.length - 1] || "";
        const folderPath = pathParts.slice(0, -1).join("/");
        const dotIndex = filename.lastIndexOf(".");
        const ext = dotIndex > -1 ? filename.slice(dotIndex + 1).toLowerCase() : "txt";
        return { filename, folderPath, ext };
    }

    function makeResult(parser, version, files, errors, warnings) {
        return {
            parser,
            version,
            files: files || [],
            errors: errors || [],
            warnings: warnings || []
        };
    }

    function parseMarkerV1(text) {
        const input = typeof text === "string" ? text : "";
        const files = [];
        const errors = [];
        const fileRegex = /#FILE-BEGIN\s*([^\n]+)\s*([\s\S]*?)#FILE-END/g;
        let match;

        while ((match = fileRegex.exec(input)) !== null) {
            const filepath = normalizePath(match[1]);
            if (!filepath) {
                errors.push("Encountered #FILE-BEGIN block with empty filepath");
                continue;
            }

            const content = (match[2] || "").replace(/^\r?\n/, "");
            const { filename, folderPath, ext } = parsePathInfo(filepath);
            if (!filename) {
                errors.push(`Invalid filepath in marker_v1 block: "${filepath}"`);
                continue;
            }

            files.push({
                filepath,
                filename,
                folderPath,
                ext,
                content
            });
        }

        return makeResult("marker_v1", "1.0.0", files, errors, []);
    }

    function applyDiffToContent(baseContent, diffText) {
        const baseLines = String(baseContent || "").split("\n");
        const diffLines = String(diffText || "").split(/\r?\n/);
        const out = [];
        let index = 0;

        for (let i = 0; i < diffLines.length; i++) {
            const line = diffLines[i];
            if (!line) continue;
            if (line.startsWith("@@")) continue;

            const prefix = line[0];
            const value = line.slice(1);

            if (prefix === " ") {
                if (index >= baseLines.length || baseLines[index] !== value) {
                    throw new Error(`Context mismatch at diff line ${i + 1}: "${line}"`);
                }
                out.push(value);
                index++;
                continue;
            }

            if (prefix === "-") {
                if (index >= baseLines.length || baseLines[index] !== value) {
                    throw new Error(`Removal mismatch at diff line ${i + 1}: "${line}"`);
                }
                index++;
                continue;
            }

            if (prefix === "+") {
                out.push(value);
                continue;
            }

            throw new Error(`Unsupported diff line prefix at line ${i + 1}: "${line}"`);
        }

        while (index < baseLines.length) {
            out.push(baseLines[index]);
            index++;
        }

        return out.join("\n");
    }

    function parseDiffV1(text, options) {
        const input = typeof text === "string" ? text : "";
        const opts = options || {};
        const files = [];
        const errors = [];
        const warnings = [];
        const blockRegex = /#FILE:\s*([^\n]+)\s*([\s\S]*?)(?=(?:\n#FILE:)|$)/g;
        let match;

        while ((match = blockRegex.exec(input)) !== null) {
            const filepath = normalizePath(match[1]);
            const block = match[2] || "";
            if (!filepath) {
                errors.push("Encountered #FILE block with empty filepath");
                continue;
            }

            const opMatch = block.match(/#OP:\s*(CREATE|MODIFY|DELETE)/i);
            const op = opMatch ? opMatch[1].toUpperCase() : "MODIFY";
            const diffMatch = block.match(/#DIFF:\s*([\s\S]*)$/i);
            const diffText = diffMatch ? diffMatch[1].replace(/^\r?\n/, "") : "";
            const { filename, folderPath, ext } = parsePathInfo(filepath);

            if (!filename) {
                errors.push(`Invalid filepath in diff_v1 block: "${filepath}"`);
                continue;
            }

            if (op !== "DELETE" && !diffText.trim()) {
                errors.push(`Missing #DIFF content for ${filepath}`);
                continue;
            }

            try {
                let content = "";
                if (op === "DELETE") {
                    content = "";
                } else if (op === "CREATE") {
                    const lines = diffText.split(/\r?\n/).filter(line => line.startsWith("+") || line.startsWith(" "));
                    content = lines.map(line => line.slice(1)).join("\n");
                } else {
                    if (typeof opts.getFileContent !== "function") {
                        throw new Error("No getFileContent resolver provided for MODIFY operation");
                    }
                    const base = opts.getFileContent(filepath);
                    if (typeof base !== "string") {
                        throw new Error("Base content not found for MODIFY operation");
                    }
                    content = applyDiffToContent(base, diffText);
                }

                files.push({
                    filepath,
                    filename,
                    folderPath,
                    ext,
                    content,
                    op: op.toLowerCase()
                });
            } catch (err) {
                errors.push(`Failed to apply diff for ${filepath}: ${err.message}`);
            }
        }

        return makeResult("diff_v1", "1.0.0", files, errors, warnings);
    }

    function parseImport(text, options) {
        const opts = options || {};
        const preferred = opts.preferredFormat || "marker_v1";
        const parsers = {
            marker_v1: parseMarkerV1,
            diff_v1: parseDiffV1
        };

        if (preferred === "auto") {
            const input = typeof text === "string" ? text : "";
            if (/#FILE:\s*[^\n]+/.test(input) && /#DIFF:/.test(input)) {
                return parsers.diff_v1(input, opts);
            }
            return parsers.marker_v1(input, opts);
        }

        const parseFn = parsers[preferred] || parsers.marker_v1;
        return parseFn(text, opts);
    }

    function parseImportText(text) {
        return parseImport(text, { preferredFormat: "marker_v1" }).files;
    }

    const api = {
        parseImport,
        parseMarkerV1,
        parseDiffV1,
        applyDiffToContent,
        parseImportText
    };

    global.DeepseekParser = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
