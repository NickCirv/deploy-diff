/**
 * Generate a human-readable deploy summary
 */

/**
 * Detect new API endpoints from file paths
 */
function detectNewEndpoints(diffData) {
  const routeFiles = diffData.newFiles.filter(f =>
    /routes?\//i.test(f.path) || /api\//i.test(f.path) || /endpoints?\//i.test(f.path)
  );
  return routeFiles.length;
}

/**
 * Build a plain-text summary sentence
 */
export function buildSummary(diffData, riskData, fromRef, toRef) {
  const { fileCount, totalAdded, totalRemoved, newFiles, deletedFiles, renamedFiles } = diffData;
  const { overallLevel, highRisk, mediumRisk } = riskData;
  const newEndpoints = detectNewEndpoints(diffData);

  const parts = [];

  // Lead sentence
  const fileWord = fileCount === 1 ? 'file' : 'files';
  parts.push(
    `This deploy changes ${fileCount} ${fileWord}, adds ${totalAdded} lines, removes ${totalRemoved} lines.`
  );

  // New / deleted files
  if (newFiles.length > 0) {
    parts.push(`${newFiles.length} new ${newFiles.length === 1 ? 'file' : 'files'} added.`);
  }
  if (deletedFiles.length > 0) {
    parts.push(`${deletedFiles.length} ${deletedFiles.length === 1 ? 'file' : 'files'} deleted.`);
  }
  if (renamedFiles.length > 0) {
    parts.push(`${renamedFiles.length} ${renamedFiles.length === 1 ? 'file' : 'files'} renamed.`);
  }

  // Risk callout
  if (highRisk.length > 0) {
    const reasons = [...new Set(highRisk.map(f => f.risk.reason))].slice(0, 2).join(', ');
    const word = highRisk.length === 1 ? 'HIGH risk change' : 'HIGH risk changes';
    parts.push(`${highRisk.length} ${word} (${reasons}).`);
  }
  if (mediumRisk.length > 0) {
    const word = mediumRisk.length === 1 ? 'MEDIUM risk change' : 'MEDIUM risk changes';
    parts.push(`${mediumRisk.length} ${word}.`);
  }
  if (highRisk.length === 0 && mediumRisk.length === 0) {
    parts.push('No high-risk changes detected.');
  }

  // API endpoints
  if (newEndpoints > 0) {
    const word = newEndpoints === 1 ? 'new API endpoint' : 'new API endpoints';
    parts.push(`${newEndpoints} ${word}.`);
  }

  // Overall risk
  const riskEmoji = { HIGH: 'Stop and review', MEDIUM: 'Proceed with care', LOW: 'Safe to ship' };
  parts.push(`Overall risk: ${overallLevel}. ${riskEmoji[overallLevel]}.`);

  // Ref context
  parts.push(`Comparing ${fromRef} → ${toRef}.`);

  return parts.join(' ');
}
