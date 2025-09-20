import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';

const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

function scriptKindForExt(ext) {
  switch (ext) {
    case '.ts': return ts.ScriptKind.TS;
    case '.tsx': return ts.ScriptKind.TSX;
    case '.js': return ts.ScriptKind.JS;
    case '.jsx': return ts.ScriptKind.JSX;
    default: return ts.ScriptKind.TS;
  }
}

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', '.next', '.vercel', 'coverage', '.cache'].includes(ent.name)) continue;
      out.push(...await walk(p));
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      if (exts.has(ext)) out.push(p);
    }
  }
  return out;
}

async function stripFile(file) {
  const text = await fs.readFile(file, 'utf8');
  const ext = path.extname(file);
  const kind = scriptKindForExt(ext);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const printer = ts.createPrinter({ removeComments: true });
  const printed = printer.printFile(sf);
  if (printed !== text) {
    await fs.writeFile(file, printed, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const roots = ['src'];
  const files = (await Promise.all(roots.map(r => walk(r)))).flat();
  let changed = 0;
  for (const f of files) {
    const ok = await stripFile(f);
    if (ok) changed++;
  }
  console.log(`Processed ${files.length} files. Updated ${changed}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
