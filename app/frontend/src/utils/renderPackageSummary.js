export function countLinkedEntities(packagePayload) {
  const linkedEntities = packagePayload?.package?.storyBible?.linkedEntities;

  return {
    characters: linkedEntities?.characters?.length || 0,
    locations: linkedEntities?.locations?.length || 0,
    timeline: linkedEntities?.timeline?.length || 0,
  };
}

export function summarizeRenderPackage(packagePayload) {
  if (!packagePayload?.package) {
    return null;
  }

  const packageData = packagePayload.package;

  return {
    mode: packagePayload.mode || packageData.status?.mode || 'mock-document-package',
    selectedTitle: packageData.manuscript?.selected?.title || 'Untitled chapter',
    selectedPath: packageData.manuscript?.selected?.path || '',
    target: packageData.output?.target || 'unknown',
    outputPath: packageData.output?.path || '',
    stylePreset: packageData.style?.preset || 'unknown',
    linkedEntities: countLinkedEntities(packagePayload),
    warningsCount: packagePayload.warnings?.length || 0,
    warnings: packagePayload.warnings || [],
  };
}
