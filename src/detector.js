import { execFileSync } from 'child_process';

/**
 * Patterns for recognising deploy-related tags / commits
 */
const DEPLOY_TAG_PATTERNS = [
  /^deploy-/i,
  /^release-/i,
  /^v\d+\.\d+/,
  /^prod-/i,
  /^production-/i,
];

const DEPLOY_COMMIT_PATTERNS = [
  /\[deploy\]/i,
  /chore:\s*deploy/i,
  /deploy to production/i,
  /release v?\d+/i,
  /automated deploy/i,
  /heroku-deploy/i,
  /vercel-deploy/i,
  /render-deploy/i,
];

/**
 * Run a git command and return stdout, or null on failure
 */
function git(...args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * List all tags sorted by creation date (newest first)
 */
function getTags() {
  const raw = git('tag', '--sort=-creatordate');
  if (!raw) return [];
  return raw.split('\n').filter(Boolean);
}

/**
 * List recent commit messages with their refs
 */
function getRecentCommits(limit = 50) {
  const raw = git('log', `--max-count=${limit}`, '--format=%H %s');
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const spaceIdx = line.indexOf(' ');
    return {
      hash: line.slice(0, spaceIdx),
      subject: line.slice(spaceIdx + 1),
    };
  });
}

/**
 * Try to find the last deploy tag
 */
function findDeployTag() {
  const tags = getTags();
  for (const tag of tags) {
    if (DEPLOY_TAG_PATTERNS.some(p => p.test(tag))) {
      return { ref: tag, source: 'deploy-tag', label: `tag ${tag}` };
    }
  }
  return null;
}

/**
 * Try to find the last deploy commit
 */
function findDeployCommit() {
  const commits = getRecentCommits(100);
  // Skip HEAD (index 0)
  for (const commit of commits.slice(1)) {
    if (DEPLOY_COMMIT_PATTERNS.some(p => p.test(commit.subject))) {
      return {
        ref: commit.hash.slice(0, 8),
        source: 'deploy-commit',
        label: `commit ${commit.hash.slice(0, 8)} ("${commit.subject}")`,
      };
    }
  }
  return null;
}

/**
 * Check for a Render / Vercel / Heroku env marker file
 * These platforms often write a deploy ID to a known location
 */
function findPlatformMarker() {
  // Render writes RENDER_GIT_COMMIT env var but we can check render.yaml existence
  // We look for common CI marker files in the repo root
  const markerFiles = ['.render-deploy', '.vercel-deploy', '.heroku-deploy', 'DEPLOY_REF'];
  for (const file of markerFiles) {
    const content = (() => {
      try {
        return execFileSync('git', ['show', `HEAD:${file}`], {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
      } catch {
        return null;
      }
    })();
    if (content) {
      return { ref: content, source: 'platform-marker', label: `${file} (${content})` };
    }
  }
  return null;
}

/**
 * Fall back to the previous commit on the default branch
 */
function findParentCommit() {
  const parent = git('rev-parse', '--short', 'HEAD~1');
  if (parent) {
    return { ref: parent, source: 'parent-commit', label: `HEAD~1 (${parent})` };
  }
  return null;
}

/**
 * Auto-detect the last deploy ref using multiple strategies
 * Returns { ref, source, label } or null
 */
export function detectLastDeploy() {
  return (
    findDeployTag() ||
    findPlatformMarker() ||
    findDeployCommit() ||
    findParentCommit()
  );
}

/**
 * Resolve a user-supplied ref or auto-detect
 */
export function resolveFromRef(fromArg) {
  if (fromArg) {
    return { ref: fromArg, source: 'user-supplied', label: fromArg };
  }
  return detectLastDeploy();
}
