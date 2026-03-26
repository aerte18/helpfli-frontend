/**
 * fetch('/api/...') -> fetch(apiUrl('/api/...'))
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, "..", "src");

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

function addImport(content) {
  if (!content.includes("apiUrl(")) return content;
  if (/from\s+["']@\/lib\/apiUrl["']/.test(content)) return content;
  if (/from\s+["'][^"']*\/apiUrl["']/.test(content)) return content;
  const line = `import { apiUrl } from "@/lib/apiUrl";\n`;
  const idx = content.indexOf("import ");
  if (idx === -1) return line + content;
  return content.slice(0, idx) + line + content.slice(idx);
}

function process(raw) {
  let out = raw;
  if (out.includes("fetch(apiUrl(")) {
    // już częściowo
  }
  // fetch('/api...') — pojedyncze cudzysłowy
  out = out.replace(/fetch\(\s*'(\/api[^']*)'\s*\)/g, "fetch(apiUrl('$1'))");
  // fetch("/api...")
  out = out.replace(/fetch\(\s*"(\/api[^"]*)"\s*\)/g, 'fetch(apiUrl("$1"))');
  // fetch(`/api...`) bez ${} w ścieżce
  out = out.replace(/fetch\(\s*`(\/api[^`$]*)`\s*\)/g, "fetch(apiUrl(`$1`))");
  // fetch(`/api...${...}...`)
  out = out.replace(
    /fetch\(\s*`(\/api[^`]*(?:\$\{[^}]+\}[^`]*)*)`\s*\)/g,
    "fetch(apiUrl(`$1`))"
  );
  // fetch('/api...', { opcje
  out = out.replace(/fetch\(\s*'(\/api[^']*)'\s*,/g, "fetch(apiUrl('$1'),");
  out = out.replace(/fetch\(\s*"(\/api[^"]*)"\s*,/g, 'fetch(apiUrl("$1"),');
  out = out.replace(
    /fetch\(\s*`(\/api[^`]*(?:\$\{[^}]+\}[^`]*)*)`\s*,/g,
    "fetch(apiUrl(`$1`),"
  );
  return out;
}

let n = 0;
for (const f of walk(srcRoot)) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.includes("/api")) continue;
  const before = raw;
  let out = process(raw);
  out = addImport(out);
  if (out !== before) {
    fs.writeFileSync(f, out, "utf8");
    n++;
    console.log(path.relative(path.join(__dirname, ".."), f));
  }
}
console.log("files:", n);
