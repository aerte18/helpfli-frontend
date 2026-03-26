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
  const line = `import { apiUrl } from "@/lib/apiUrl";\n`;
  const idx = content.indexOf("import ");
  if (idx === -1) return line + content;
  return content.slice(0, idx) + line + content.slice(idx);
}

function process(c) {
  let out = c;
  if (!out.includes("${import.meta.env.VITE_API_URL")) return out;
  const reFetch = /fetch\(\s*`(\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api([^`]*))\`,\s*\{/g;
  out = out.replace(reFetch, (_, _full, rest) => `fetch(apiUrl(\`/api${rest}\`), {`);
  const reFetch2 = /fetch\(\s*`(\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api([^`]*))\`\)/g;
  out = out.replace(reFetch2, (_, _full, rest) => `fetch(apiUrl(\`/api${rest}\`))`);
  out = out.replace(
    /\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api/g,
    "apiUrl(`/api"
  );
  out = out.replace(
    /apiUrl\(`((?:[^`$]|\$\{[^}]+\})*)`,\s*\{/g,
    "apiUrl(`$1`), {"
  );
  return out;
}

let n = 0;
for (const f of walk(srcRoot)) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.includes("${import.meta.env.VITE_API_URL")) continue;
  let out = process(raw);
  out = addImport(out);
  if (out !== raw) {
    fs.writeFileSync(f, out, "utf8");
    n++;
    console.log(path.relative(path.join(__dirname, ".."), f));
  }
}
console.log("files:", n);
