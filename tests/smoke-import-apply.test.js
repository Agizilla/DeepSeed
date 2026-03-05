const test = require("node:test");
const assert = require("node:assert/strict");
const parser = require("../deepseek-parser.js");

function normalizePath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\.?\//, "");
}

function applyParsedFiles(state, entries) {
    entries.forEach(entry => {
        const relative = normalizePath(entry.filepath);
        const projectPath = `${state.root}/${relative}`;
        const op = (entry.op || "upsert").toLowerCase();
        const exists = state.files.has(projectPath);

        if (op === "delete") {
            if (exists) {
                state.files.delete(projectPath);
                state.deleted.add(projectPath);
                state.modified.delete(projectPath);
                state.newFiles.delete(projectPath);
            }
            return;
        }

        state.files.set(projectPath, entry.content);
        state.deleted.delete(projectPath);

        if (!exists) {
            state.newFiles.add(projectPath);
            return;
        }

        const original = state.original.get(projectPath) || "";
        if (original !== entry.content) {
            state.modified.add(projectPath);
            state.newFiles.delete(projectPath);
        } else {
            state.modified.delete(projectPath);
        }
    });
}

test("smoke: import -> parse -> apply flow", () => {
    const state = {
        root: "Root",
        files: new Map([
            ["Root/src/app.py", "print('a')\nprint('b')"],
            ["Root/src/old.py", "print('legacy')"]
        ]),
        original: new Map([
            ["Root/src/app.py", "print('a')\nprint('b')"],
            ["Root/src/old.py", "print('legacy')"]
        ]),
        modified: new Set(),
        newFiles: new Set(),
        deleted: new Set()
    };

    const input = [
        "#FILE: src/app.py",
        "#OP: MODIFY",
        "#DIFF:",
        "@@",
        " print('a')",
        "-print('b')",
        "+print('c')",
        "",
        "#FILE: docs/new.md",
        "#OP: CREATE",
        "#DIFF:",
        "+# Title",
        "+",
        "+Body",
        "",
        "#FILE: src/old.py",
        "#OP: DELETE",
        "#DIFF:",
        "-print('legacy')"
    ].join("\n");

    const parsed = parser.parseImport(input, {
        preferredFormat: "diff_v1",
        strict: true,
        getFileContent: (filepath) => state.files.get(`Root/${normalizePath(filepath)}`)
    });

    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.files.length, 3);

    applyParsedFiles(state, parsed.files);

    assert.equal(state.files.get("Root/src/app.py"), "print('a')\nprint('c')");
    assert.equal(state.files.get("Root/docs/new.md"), "# Title\n\nBody");
    assert.equal(state.files.has("Root/src/old.py"), false);
    assert.equal(state.modified.has("Root/src/app.py"), true);
    assert.equal(state.newFiles.has("Root/docs/new.md"), true);
    assert.equal(state.deleted.has("Root/src/old.py"), true);
});
