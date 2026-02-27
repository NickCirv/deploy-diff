import { execFileSync } from 'child_process';

/**
 * Parse git diff --stat output into structured data
 */
function parseStatOutput(raw) {
  const lines = raw.trim().split('\n');
  const files = [];
  let totalAdded = 0;
  let totalRemoved = 0;

  for (const line of lines) {
    // Summary line: "3 files changed, 120 insertions(+), 45 deletions(-)"
    if (line.includes('changed')) continue;

    // File line: " src/index.js | 34 ++--"
    const match = line.match(/^\s*(.+?)\s+\|\s+(\d+)\s*([\+\-]*)/);
    if (!match) continue;

    const [, rawPath, count] = match;
    const path = rawPath.trim();
    const changes = parseInt(count, 10);

    files.push({ path, changes });
  }

  return { files, totalAdded, totalRemoved };
}

/**
 * Get diff stats between two git refs
 */
export function getDiffStat(from, to) {
  try {
    const statOutput = execFileSync(
      'git',
      ['diff', '--stat', from, to],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const numstatOutput = execFileSync(
      'git',
      ['diff', '--numstat', from, to],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const nameStatusOutput = execFileSync(
      'git',
      ['diff', '--name-status', from, to],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    return parseFullDiff(statOutput, numstatOutput, nameStatusOutput);
  } catch (err) {
    throw new Error(`Git diff failed: ${err.message}`);
  }
}

/**
 * Parse all diff outputs into unified file list
 */
function parseFullDiff(statRaw, numstatRaw, nameStatusRaw) {
  const fileMap = new Map();
  let totalAdded = 0;
  let totalRemoved = 0;

  // Parse numstat for line counts
  for (const line of numstatRaw.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const [added, removed, path] = parts;
    const addedNum = added === '-' ? 0 : parseInt(added, 10);
    const removedNum = removed === '-' ? 0 : parseInt(removed, 10);

    fileMap.set(path, {
      path,
      added: addedNum,
      removed: removedNum,
      status: 'modified',
      isBinary: added === '-',
    });

    totalAdded += addedNum;
    totalRemoved += removedNum;
  }

  // Parse name-status for file type (added, deleted, renamed)
  for (const line of nameStatusRaw.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const statusCode = parts[0][0];

    if (statusCode === 'A') {
      const path = parts[1];
      const entry = fileMap.get(path) || { path, added: 0, removed: 0, isBinary: false };
      fileMap.set(path, { ...entry, status: 'added' });
    } else if (statusCode === 'D') {
      const path = parts[1];
      const entry = fileMap.get(path) || { path, added: 0, removed: 0, isBinary: false };
      fileMap.set(path, { ...entry, status: 'deleted' });
    } else if (statusCode === 'R') {
      const oldPath = parts[1];
      const newPath = parts[2];
      const entry = fileMap.get(newPath) || fileMap.get(oldPath) || { path: newPath, added: 0, removed: 0, isBinary: false };
      fileMap.delete(oldPath);
      fileMap.set(newPath, { ...entry, path: newPath, oldPath, status: 'renamed' });
    } else if (statusCode === 'M') {
      const path = parts[1];
      const entry = fileMap.get(path) || { path, added: 0, removed: 0, isBinary: false };
      fileMap.set(path, { ...entry, status: 'modified' });
    }
  }

  const files = [...fileMap.values()];

  return {
    files,
    totalAdded,
    totalRemoved,
    fileCount: files.length,
    newFiles: files.filter(f => f.status === 'added'),
    deletedFiles: files.filter(f => f.status === 'deleted'),
    renamedFiles: files.filter(f => f.status === 'renamed'),
    modifiedFiles: files.filter(f => f.status === 'modified'),
  };
}

/**
 * Validate that refs exist in the repo
 */
export function validateRef(ref) {
  try {
    execFileSync('git', ['rev-parse', '--verify', ref], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current HEAD ref
 */
export function getHead() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'HEAD';
  }
}
