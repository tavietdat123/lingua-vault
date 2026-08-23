/**
 * One-shot codemod: replace the shared-account fallbacks in the API layer with
 * strict per-user scoping.
 *
 *   node server/scripts/migrate-user-isolation.mjs           # apply
 *   node server/scripts/migrate-user-isolation.mjs --dry-run # report only
 *
 * It performs three mechanical edits across server/src/{controllers,services}:
 *
 *  1. Collapses the four leaky ownership clauses (listed in CLAUSES below) down
 *     to `user_id = ?`.
 *  2. Collapses the now-redundant repeated `userId` arguments in the matching
 *     .get()/.all()/.run() calls, because each clause dropped placeholders.
 *  3. Rewrites `req.user?.id || 'admin_master_user_id'` (and the backup
 *     controller's `req.query.userId` variant) to `currentUserId(req)`, adding
 *     the import where needed.
 *
 * Re-running it is a no-op. Review `git diff` afterwards: step 2 is a
 * heuristic, so every changed statement still needs a human read.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const DIRS = ['controllers', 'services'];

/** Builds a whitespace-tolerant matcher from a literal SQL fragment. */
const rx = (literal) =>
  new RegExp(
    literal
      .split(/\s+/)
      .map((tok) => tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+'),
    'g'
  );

const CLAUSES = [
  // 3 placeholders -> 1
  {
    from: rx("(user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))"),
    to: 'user_id = ?'
  },
  // 2 placeholders -> 1
  { from: rx("(user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')"), to: 'user_id = ?' },
  // 1 placeholder -> 1
  { from: rx("(user_id = ? OR user_id IS NULL OR user_id = 'admin_master_user_id')"), to: 'user_id = ?' },
  // 3 placeholders -> 1. Safe because every user_profile row carries user_id;
  // the legacy id='default_user' row belongs to admin_master_user_id.
  { from: rx("user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')"), to: 'user_id = ?' }
];

/** Splits a balanced argument list on top-level commas. */
function splitArgs(src, openIdx) {
  let depth = 0;
  let start = openIdx + 1;
  const args = [];
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) {
        args.push(src.slice(start, i));
        return { args, end: i };
      }
    } else if (ch === '`' || ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (ch === ',' && depth === 1) {
      args.push(src.slice(start, i));
      start = i + 1;
    }
  }
  return null;
}

/** Collapses runs of identical consecutive arguments in .get()/.all()/.run(). */
function collapseDuplicateArgs(src) {
  const callRx = /\.(get|all|run)\s*\(/g;
  let out = src;
  let changed = true;
  while (changed) {
    changed = false;
    callRx.lastIndex = 0;
    let m;
    while ((m = callRx.exec(out))) {
      const openIdx = m.index + m[0].length - 1;
      const parsed = splitArgs(out, openIdx);
      if (!parsed) continue;
      const trimmed = parsed.args.map((a) => a.trim()).filter((a) => a !== '');
      if (trimmed.length < 2) continue;
      const deduped = trimmed.filter((a, i) => i === 0 || a !== trimmed[i - 1]);
      if (deduped.length === trimmed.length) continue;
      out = out.slice(0, openIdx + 1) + deduped.join(', ') + out.slice(parsed.end);
      changed = true;
      break;
    }
  }
  return out;
}

let touched = 0;
for (const dir of DIRS) {
  for (const file of fs.readdirSync(path.join(ROOT, dir))) {
    if (!file.endsWith('.js')) continue;
    const full = path.join(ROOT, dir, file);
    const before = fs.readFileSync(full, 'utf8');
    let after = before;

    for (const { from, to } of CLAUSES) after = after.replace(from, to);
    if (after !== before) after = collapseDuplicateArgs(after);

    after = after.replace(
      /req\.user\?\.id\s*\|\|\s*req\.query\.userId\s*\|\|\s*'admin_master_user_id'/g,
      'currentUserId(req)'
    );
    after = after.replace(/req\.user\?\.id\s*\|\|\s*'admin_master_user_id'/g, 'currentUserId(req)');

    if (after.includes('currentUserId(req)') && !after.includes("from '../middleware/auth.js'")) {
      after = after.replace(/^(import[^\n]*\n)/, `$1import { currentUserId } from '../middleware/auth.js';\n`);
    }

    if (after !== before) {
      if (!DRY_RUN) fs.writeFileSync(full, after, 'utf8');
      console.log(`${DRY_RUN ? 'would rewrite' : 'rewrote'} ${dir}/${file}`);
      touched++;
    }
  }
}
console.log(`files ${DRY_RUN ? 'to change' : 'changed'}: ${touched}`);
