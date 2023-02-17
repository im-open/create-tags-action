import semver from 'semver';
import SemVer from 'semver/classes/semver';

export function canCoerceAsSemver(value: string | SemVer | null | undefined) {
  if (!value) return false;
  if (value instanceof SemVer) return true;
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

export function isStableSemver(value: string) {
  return semver.parse(value)?.prerelease.length === 0 ?? false;
}

export function isValidSemVer(value: string) {
  return semver.valid(value) !== null;
}

export function isValidAndStableSemver(value: string) {
  const semverVersion = semver.parse(value);
  if (!semverVersion) return false;
  return isStableSemver(value);
}
