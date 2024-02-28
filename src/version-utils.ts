import semver from 'semver';

export function isStableSemver(value: string) {
  return semver.parse(value)?.prerelease.length === 0 || false;
}

function isValidAndStableSemver(value: string) {
  const parsed = semver.parse(value);
  if (!parsed) return false;
  return isStableSemver(value);
}

export function isValidSemVer(value: string) {
  return semver.valid(value) !== null;
}

export function canCoerceAsSemver(value: string | null | undefined) {
  if (!value) return false;
  return semver.valid(semver.coerce(value)) !== null;
}

export function getMajor(value: string) {
  if (!isValidAndStableSemver(value))
    throw new TypeError(`Tag [${value}] doesn't satisfy semantic versioning specification`);
  return value.split('.')[0];
}

export function getMajorAndMinor(value: string) {
  if (!isValidAndStableSemver(value))
    throw new TypeError(`Tag [${value}] doesn't satisfy semantic versioning specification`);
  return value.split('.').slice(0, 2).join('.');
}
