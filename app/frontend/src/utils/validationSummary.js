export function summarizeValidation(validationResult) {
  const checks = validationResult?.checks || [];
  const passed = checks.filter((check) => check.exitCode === 0).length;
  const failed = checks.length - passed;

  return {
    ok: Boolean(validationResult?.ok) && failed === 0,
    total: checks.length,
    passed,
    failed,
  };
}

export function getCheckStatus(check) {
  return check?.exitCode === 0 ? 'pass' : 'fail';
}
