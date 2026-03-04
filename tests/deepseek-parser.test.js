const test = require("node:test");
const assert = require("node:assert/strict");
const parser = require("../deepseek-parser.js");

test("marker_v1 parses basic blocks", () => {
    const input = [
        "#FILE-BEGIN docs/README.md",
        "# Hello",
        "#FILE-END",
        "#FILE-BEGIN src/app.py",
        "print('ok')",
        "#FILE-END"
    ].join("\n");

    const result = parser.parseImport(input, { preferredFormat: "marker_v1" });
    assert.equal(result.parser, "marker_v1");
    assert.equal(result.files.length, 2);
    assert.equal(result.errors.length, 0);
    assert.equal(result.files[0].filepath, "docs/README.md");
    assert.equal(result.files[1].ext, "py");
});

test("diff_v1 MODIFY applies patch with base resolver", () => {
    const input = [
        "#FILE: src/app.py",
        "#OP: MODIFY",
        "#DIFF:",
        "@@",
        " print('a')",
        "-print('b')",
        "+print('c')"
    ].join("\n");

    const result = parser.parseImport(input, {
        preferredFormat: "diff_v1",
        getFileContent: () => "print('a')\nprint('b')",
        strict: true
    });

    assert.equal(result.parser, "diff_v1");
    assert.equal(result.files.length, 1);
    assert.equal(result.errors.length, 0);
    assert.equal(result.files[0].content, "print('a')\nprint('c')");
});

test("diff_v1 CREATE builds content from + and space lines", () => {
    const input = [
        "#FILE: docs/new.md",
        "#OP: CREATE",
        "#DIFF:",
        "+# Title",
        "+",
        "+Body"
    ].join("\n");

    const result = parser.parseImport(input, {
        preferredFormat: "diff_v1",
        strict: true
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].content, "# Title\n\nBody");
    assert.equal(result.errors.length, 0);
});

test("diff_v1 DELETE emits delete operation entry", () => {
    const input = [
        "#FILE: src/old.py",
        "#OP: DELETE",
        "#DIFF:",
        "-print('legacy')"
    ].join("\n");

    const result = parser.parseImport(input, {
        preferredFormat: "diff_v1",
        strict: true
    });

    assert.equal(result.files.length, 1);
    assert.equal(result.errors.length, 0);
    assert.equal(result.files[0].op, "delete");
    assert.equal(result.files[0].filepath, "src/old.py");
});

test("auto mode selects diff_v1 when diff markers exist", () => {
    const input = [
        "#FILE: src/main.py",
        "#OP: CREATE",
        "#DIFF:",
        "+print('x')"
    ].join("\n");

    const result = parser.parseImport(input, { preferredFormat: "auto", strict: true });
    assert.equal(result.parser, "diff_v1");
    assert.equal(result.files.length, 1);
});
