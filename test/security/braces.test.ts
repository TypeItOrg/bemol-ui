import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

type AstNode = {
  type: string;
  nodes?: AstNode[];
  value?: string;
  parent?: AstNode;
};

function resolveBraces(packages: string[]): string {
  let consumer = createRequire(__filename);

  for (const name of packages) {
    consumer = createRequire(consumer.resolve(name));
  }

  return consumer.resolve("braces");
}

const installedPaths = [
  resolveBraces(["eslint-config-next", "@next/eslint-plugin-next", "fast-glob", "micromatch"]),
  resolveBraces(["shadcn", "fast-glob", "micromatch"]),
  resolveBraces(["shadcn", "ts-morph", "@ts-morph/common", "fast-glob", "micromatch"]),
];

const braces = createRequire(__filename)(installedPaths[0]);

function nestedAst(depth: number): AstNode {
  let node: AstNode = { type: "text", value: "a" };

  for (let index = 0; index < depth; index++) {
    node = { type: "paren", nodes: [node] };
  }

  return { type: "root", nodes: [node] };
}

describe("braces CVE-2026-93687 patch", () => {
  it("uses the same patched instance in every installed transitive consumer", () => {
    expect(new Set(installedPaths).size).toBe(1);
  });

  it("preserves ordinary compilation, expansion and numeric ranges", () => {
    expect(braces("src/{app,features}/**/*.ts")).toEqual(["src/(app|features)/**/*.ts"]);
    expect(braces.expand("file-{1..3}.ts")).toEqual(["file-1.ts", "file-2.ts", "file-3.ts"]);
    expect(braces.expand("foo/({a,b})")).toEqual(["foo/(a)", "foo/(b)"]);
  });

  it.each([
    ["{", "}"],
    ["(", ")"],
  ])("accepts exactly 100 levels of %s nesting", (open, close) => {
    const pattern = open.repeat(100) + "a,b" + close.repeat(100);

    for (const method of ["parse", "compile", "expand", "stringify"]) {
      expect(() => braces[method](pattern)).not.toThrow();
    }

    expect(braces.stringify(pattern)).toBe(pattern);
  });

  it.each(["parse", "compile", "expand", "stringify"])("rejects excessive string nesting in %s with a deliberate depth error", (method) => {
    for (const depth of [101, 3500]) {
      for (const [open, close] of [
        ["{", "}"],
        ["(", ")"],
      ]) {
        const pattern = open.repeat(depth) + "a,b" + close.repeat(depth);

        expect(() => braces[method](pattern)).toThrow("Input nesting exceeds max depth (100)");
      }
    }
  });

  it("counts mixed and unmatched delimiters without treating literal delimiters as nesting", () => {
    expect(() => braces.parse("{(".repeat(51) + "a" + ")}".repeat(51))).toThrow("Input nesting exceeds max depth (100)");
    expect(() => braces.parse("{".repeat(101))).toThrow("Input nesting exceeds max depth (100)");

    for (const pattern of ["\\{".repeat(101), '"' + "{".repeat(101) + '"', "[" + "{".repeat(101) + "]"]) {
      expect(() => braces.parse(pattern)).not.toThrow();
    }
  });

  it("does not let caller options disable the safety cap", () => {
    const pattern = "{".repeat(101) + "a,b" + "}".repeat(101);

    for (const maxDepth of [Infinity, 10_000, NaN, false]) {
      expect(() => braces(pattern, { maxDepth })).toThrow("Input nesting exceeds max depth (100)");
    }
  });

  it.each(["compile", "expand", "stringify"])("bounds supplied deep and cyclic ASTs in %s", (method) => {
    expect(() => braces[method](nestedAst(100))).not.toThrow();
    expect(() => braces[method](nestedAst(101))).toThrow("exceeds max depth (100)");

    const cyclic: AstNode = { type: "root", nodes: [] };
    cyclic.nodes = [cyclic];

    expect(() => braces[method](cyclic)).toThrow("exceeds max depth (100)");
  });

  it.each([1, 2])("rejects an expansion parent cycle of %i nodes without hanging", (size) => {
    const ast: AstNode = { type: "paren", nodes: [{ type: "text", value: "a" }] };
    ast.parent = size === 1 ? ast : { type: "paren", parent: ast };

    expect(() => runInNewContext("braces.expand(ast)", { braces, ast }, { timeout: 250 })).toThrow("AST parent depth exceeds max depth (100)");
  });

  it("preserves stringify escaping for existing parsed patterns", () => {
    for (const pattern of ["{{a}}", "{a,{b}}", "{{x}y}", "{a,{b,{c}}", "{}{a}"]) {
      expect(braces.stringify(braces.parse(pattern), { escapeInvalid: true })).toBe(pattern);
    }
  });
});
