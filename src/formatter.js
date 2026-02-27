import chalk from 'chalk';

const ACCENT = chalk.hex('#F97316');

/**
 * Risk badge styled text
 */
export function riskBadge(level) {
  switch (level) {
    case 'HIGH':
      return chalk.bgRed.white.bold(` HIGH `);
    case 'MEDIUM':
      return chalk.bgYellow.black.bold(` MED `);
    case 'LOW':
      return chalk.bgGreen.white.bold(` LOW `);
    default:
      return chalk.bgGray.white(` UNK `);
  }
}

/**
 * Status indicator for a file
 */
function fileIndicator(status) {
  switch (status) {
    case 'added':
      return chalk.green('+');
    case 'deleted':
      return chalk.red('-');
    case 'renamed':
      return chalk.yellow('~');
    default:
      return chalk.blue('~');
  }
}

/**
 * Line change stats string "+X / -Y"
 */
function lineStats(file) {
  const parts = [];
  if (file.isBinary) return chalk.dim('[binary]');
  if (file.added) parts.push(chalk.green(`+${file.added}`));
  if (file.removed) parts.push(chalk.red(`-${file.removed}`));
  return parts.join(' ') || chalk.dim('0');
}

/**
 * Print the diff header
 */
export function printHeader(fromRef, toRef, fromLabel) {
  console.log('');
  console.log(ACCENT.bold('  deploy-diff'));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  ${chalk.dim('from')} ${chalk.cyan(fromLabel || fromRef)}`);
  console.log(`  ${chalk.dim('to  ')} ${chalk.cyan(toRef)}`);
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log('');
}

/**
 * Print overall stats bar
 */
export function printStats(diffData) {
  const { fileCount, totalAdded, totalRemoved } = diffData;
  const bar = [
    chalk.white.bold(`${fileCount} files`),
    chalk.green(`+${totalAdded}`),
    chalk.red(`-${totalRemoved}`),
  ].join(chalk.dim('  ·  '));
  console.log(`  ${bar}`);
  console.log('');
}

/**
 * Print file tree with change indicators
 */
export function printFileTree(categorized) {
  // Group by risk level for display
  const grouped = {
    HIGH: categorized.filter(f => f.risk.level === 'HIGH'),
    MEDIUM: categorized.filter(f => f.risk.level === 'MEDIUM'),
    LOW: categorized.filter(f => f.risk.level === 'LOW'),
  };

  for (const level of ['HIGH', 'MEDIUM', 'LOW']) {
    const files = grouped[level];
    if (!files.length) continue;

    console.log(`  ${riskBadge(level)}`);

    for (const file of files) {
      const indicator = fileIndicator(file.status);
      const pathStr = file.oldPath
        ? `${chalk.dim(file.oldPath)} → ${file.path}`
        : file.path;
      const stats = lineStats(file);
      const reason = chalk.dim(`  ← ${file.risk.reason}`);

      console.log(`    ${indicator} ${pathStr}  ${stats}${reason}`);
    }

    console.log('');
  }
}

/**
 * Print risk summary section
 */
export function printRiskSummary(riskData) {
  const { overallLevel, highRisk, mediumRisk, lowRisk } = riskData;

  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  Risk: ${riskBadge(overallLevel)}`);

  if (highRisk.length > 0) {
    console.log(`  ${chalk.red.bold('!')} ${highRisk.length} high-risk ${highRisk.length === 1 ? 'file' : 'files'} require manual review`);
  }
  if (mediumRisk.length > 0) {
    console.log(`  ${chalk.yellow('!')} ${mediumRisk.length} medium-risk ${mediumRisk.length === 1 ? 'file' : 'files'} — verify before shipping`);
  }
  if (highRisk.length === 0 && mediumRisk.length === 0) {
    console.log(`  ${chalk.green('✓')} No high or medium risk changes`);
  }
  console.log('');
}

/**
 * Print human-readable summary
 */
export function printSummary(summaryText) {
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(chalk.bold('  Summary'));
  console.log('');
  const words = summaryText.split('. ').filter(Boolean);
  for (const sentence of words) {
    console.log(`  ${sentence}.`);
  }
  console.log('');
}

/**
 * Print a minimal one-line status for CI use
 */
export function printCiLine(riskData, diffData) {
  const { overallLevel, highRisk, mediumRisk } = riskData;
  const badge = riskBadge(overallLevel);
  const files = chalk.dim(`${diffData.fileCount} files`);
  const high = highRisk.length ? chalk.red(`${highRisk.length} HIGH`) : null;
  const medium = mediumRisk.length ? chalk.yellow(`${mediumRisk.length} MED`) : null;
  const counts = [high, medium].filter(Boolean).join('  ') || chalk.green('clean');
  console.log(`  deploy-diff  ${badge}  ${files}  ${counts}`);
}
