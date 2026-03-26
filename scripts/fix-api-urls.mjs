/**
 * Przepina fetch(`${API}/api...`) na fetch(apiUrl(`/api...`)) oraz
 * apiGet(`${API}/api...`) na apiGet(`/api...`).
 * Uruchom z folderu frontend: node scripts/fix-api-urls.mjs
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

/** Fragment od ${API}/api do końca template (przed `) */
const TPL_REST = "((?:[^`$]|\\$\\{[^}]+\\})*)";

function stripApiPrefix(full) {
  return full.replace(/^\$\{API\}\/api/, "/api");
}

function processContent(c) {
  let out = c;

  // fetch(`...${API}/api...`, {  -> fetch(apiUrl(`/api...`), {
  out = out.replace(
    new RegExp(`fetch\\(\\s*\`(\\$\\{API\\}\\/api${TPL_REST})\`,\\s*\\{`, "g"),
    (_, full) => `fetch(apiUrl(\`${stripApiPrefix(full)}\`), {`
  );

  // fetch(`...${API}/api...`)  — koniec na `) bez przecinka przed {
  out = out.replace(
    new RegExp(`fetch\\(\\s*\`(\\$\\{API\\}\\/api${TPL_REST})\`\\)`, "g"),
    (_, full) => `fetch(apiUrl(\`${stripApiPrefix(full)}\`))`
  );

  // apiGet / apiPost / apiPut — lib/api już dokleja VITE_API_URL
  out = out.replace(
    /\b(apiGet|apiPost|apiPut)\(\s*`(\$\{API\}\/api)/g,
    "$1(`/api"
  );

  // Pozostałe `${API}/api` (href, zmienne url, itd.)
  out = out.replace(/\$\{API\}\/api/g, "apiUrl(`/api");
  // Zamknij apiUrl: apiUrl(`/api...`, { -> apiUrl(`/api...`), {
  out = out.replace(
    new RegExp(`apiUrl\\(\`(${TPL_REST})`, "g"),
    (m, start) => {
      // tylko jeśli zaczyna się od /api i ma `, { bez zamknięcia
      return m;
    }
  );

  return out;
}

// Krok 2: po globalnym ${API}/api -> apiUrl(`/api trzeba zamknąć wywołanie przed `, {`
function closeApiUrlCalls(out) {
  // apiUrl(`/api/foo`, { -> apiUrl(`/api/foo`), {
  return out.replace(
    /apiUrl\(`((?:[^`$]|\$\{[^}]+\})*)`,\s*\{/g,
    "apiUrl(`$1`), {"
  );
}

// Usuń podwójne apiUrl jeśli skrypt puścimy 2x
function dedupe(out) {
  return out.replace(/apiUrl\(`apiUrl\(`(\/api[^`]*?)`\)/g, "apiUrl(`$1`)");
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

const files = walk(srcRoot);
let n = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.includes("${API}/api") && !raw.includes("fetch('/api") && !raw.includes('fetch("/api') && !raw.includes("fetch(`/api")) continue;

  let out = processContent(raw);
  out = closeApiUrlCalls(out);
  out = dedupe(out);
  out = addImport(out);

  if (out !== raw) {
    fs.writeFileSync(f, out, "utf8");
    n++;
    console.log(path.relative(path.join(__dirname, ".."), f));
  }
}
console.log("files changed:", n);
