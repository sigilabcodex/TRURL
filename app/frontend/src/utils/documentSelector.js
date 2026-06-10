export function getDocumentOptions(project) {
  const documents = Array.isArray(project?.documents) ? project.documents : [];
  const currentDocumentId = getCurrentDocumentId(project);

  return documents
    .filter((document) => document && typeof document.id === 'string' && document.id.length > 0)
    .map((document) => ({
      id: document.id,
      title: typeof document.title === 'string' && document.title.length > 0 ? document.title : document.id,
      isCurrent: document.id === currentDocumentId,
    }));
}

export function getCurrentDocumentId(project) {
  if (typeof project?.currentDocument?.id === 'string' && project.currentDocument.id.length > 0) {
    return project.currentDocument.id;
  }

  const documents = Array.isArray(project?.documents) ? project.documents : [];
  if (typeof project?.defaultDocument === 'string'
    && documents.some((document) => document?.id === project.defaultDocument)) {
    return project.defaultDocument;
  }

  return typeof documents[0]?.id === 'string' ? documents[0].id : '';
}

export function getCurrentDocument(project) {
  const currentDocumentId = getCurrentDocumentId(project);
  const documents = Array.isArray(project?.documents) ? project.documents : [];
  return documents.find((document) => document?.id === currentDocumentId) || project?.currentDocument || null;
}

export function isDocumentSwitchingAvailable() {
  return false;
}
