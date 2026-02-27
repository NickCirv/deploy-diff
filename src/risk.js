/**
 * Risk assessment for deploy diffs
 * Returns risk level and categorized file list
 */

const HIGH_RISK_PATTERNS = [
  { pattern: /\.env(\.|$)/i, reason: 'Environment config' },
  { pattern: /\.env\.(local|production|staging|test)/i, reason: 'Environment config' },
  { pattern: /config\/(production|staging|secrets)/i, reason: 'Production config' },
  { pattern: /migrations?\//i, reason: 'Database migration' },
  { pattern: /migrate\.(js|ts|py|rb|sql)/i, reason: 'Database migration' },
  { pattern: /schema\.(js|ts|prisma|sql)/i, reason: 'Database schema' },
  { pattern: /auth\.(js|ts)/i, reason: 'Auth file' },
  { pattern: /middleware\/auth/i, reason: 'Auth middleware' },
  { pattern: /passport\.(js|ts)/i, reason: 'Auth (Passport)' },
  { pattern: /jwt\.(js|ts)/i, reason: 'Auth (JWT)' },
  { pattern: /^package\.json$/i, reason: 'Dependency manifest' },
  { pattern: /Dockerfile(\.|$)/i, reason: 'Docker config' },
  { pattern: /docker-compose/i, reason: 'Docker compose' },
  { pattern: /secrets?\.(js|ts|json|ya?ml)/i, reason: 'Secrets file' },
  { pattern: /\.pem$|\.key$|\.crt$/i, reason: 'Certificate / key file' },
];

const MEDIUM_RISK_PATTERNS = [
  { pattern: /routes?\//i, reason: 'API route' },
  { pattern: /api\/.*\.(js|ts)/i, reason: 'API handler' },
  { pattern: /controllers?\//i, reason: 'Controller' },
  { pattern: /models?\//i, reason: 'Data model' },
  { pattern: /database\.(js|ts)/i, reason: 'Database config' },
  { pattern: /db\.(js|ts)/i, reason: 'Database module' },
  { pattern: /seed\.(js|ts|sql)/i, reason: 'Database seed' },
  { pattern: /webhook\.(js|ts)/i, reason: 'Webhook handler' },
  { pattern: /payment\.(js|ts)/i, reason: 'Payment logic' },
  { pattern: /stripe\.(js|ts)/i, reason: 'Stripe integration' },
  { pattern: /nginx\.conf/i, reason: 'Nginx config' },
  { pattern: /\.ya?ml$/i, reason: 'Config / CI file' },
  { pattern: /\.toml$/i, reason: 'Config file' },
  { pattern: /render\.ya?ml/i, reason: 'Render config' },
  { pattern: /vercel\.json/i, reason: 'Vercel config' },
];

const LOW_RISK_PATTERNS = [
  { pattern: /\.(md|txt|rst)$/i, reason: 'Documentation' },
  { pattern: /\.(test|spec)\.(js|ts|py|rb)/i, reason: 'Test file' },
  { pattern: /__tests__\//i, reason: 'Test directory' },
  { pattern: /\.css$|\.scss$|\.sass$|\.less$/i, reason: 'Styling' },
  { pattern: /\.svg$|\.png$|\.jpg$|\.gif$|\.ico$/i, reason: 'Asset' },
  { pattern: /README/i, reason: 'README' },
  { pattern: /CHANGELOG/i, reason: 'Changelog' },
  { pattern: /\.gitignore|\.gitattributes/i, reason: 'Git config' },
  { pattern: /\.eslintrc|\.prettierrc|\.editorconfig/i, reason: 'Lint / format config' },
];

/**
 * Classify a single file path into a risk tier
 */
function classifyFile(file) {
  const path = file.path;
  const lineChanges = (file.added || 0) + (file.removed || 0);

  for (const { pattern, reason } of HIGH_RISK_PATTERNS) {
    if (pattern.test(path)) {
      return { level: 'HIGH', reason, lineChanges };
    }
  }

  // Large change volume bumps risk
  if (lineChanges > 200) {
    return { level: 'HIGH', reason: `Large change (${lineChanges} lines)`, lineChanges };
  }

  for (const { pattern, reason } of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(path)) {
      return { level: 'MEDIUM', reason, lineChanges };
    }
  }

  for (const { pattern, reason } of LOW_RISK_PATTERNS) {
    if (pattern.test(path)) {
      return { level: 'LOW', reason, lineChanges };
    }
  }

  return { level: 'LOW', reason: 'General change', lineChanges };
}

/**
 * Score map for risk level
 */
const RISK_SCORE = { HIGH: 3, MEDIUM: 2, LOW: 1 };

/**
 * Compute overall risk from diff data
 */
export function assessRisk(diffData) {
  const { files, totalAdded, totalRemoved } = diffData;

  const categorized = files.map(file => ({
    ...file,
    risk: classifyFile(file),
  }));

  const highRisk = categorized.filter(f => f.risk.level === 'HIGH');
  const mediumRisk = categorized.filter(f => f.risk.level === 'MEDIUM');
  const lowRisk = categorized.filter(f => f.risk.level === 'LOW');

  // Aggregate score
  const score =
    highRisk.length * RISK_SCORE.HIGH +
    mediumRisk.length * RISK_SCORE.MEDIUM +
    lowRisk.length * RISK_SCORE.LOW;

  let overallLevel;
  if (highRisk.length > 0) {
    overallLevel = 'HIGH';
  } else if (mediumRisk.length > 0) {
    overallLevel = 'MEDIUM';
  } else {
    overallLevel = 'LOW';
  }

  return {
    overallLevel,
    score,
    highRisk,
    mediumRisk,
    lowRisk,
    categorized,
    fileCount: files.length,
    totalAdded,
    totalRemoved,
  };
}
