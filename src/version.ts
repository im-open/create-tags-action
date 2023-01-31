import semverParse from 'semver/functions/parse';
import SemVer from 'semver/classes/semver';

export function isSemVer(value: string | SemVer | null | undefined) {
  if (!value) return false;
  if (value instanceof SemVer) return true;
  return semverParse(value) ? true : false;
}

export function getMajorTag(tag: string) {
  if (!isSemVer) throw new TypeError(`Tag [${tag}] is not a semver`);
  return tag.split('.')[0];
}

export function getMajorMinorTag(tag: string) {
  if (!isSemVer) throw new TypeError(`Tag [${tag}] is not a semver`);
  return tag.split('.').slice(0, 2).join('.');
}

export function isStableSemverVersion(version: SemVer) {
  return version.prerelease.length === 0;
}

export function validateSemverVersionFromTag(tag: string): void {
  const semverVersion = semverParse(tag);
  if (!semverVersion) {
    throw new Error(`Tag [${tag}] doesn't satisfy semantic versioning specification`);
  }

  if (!isStableSemverVersion(semverVersion)) {
    throw new Error('It is not allowed to specify pre-release tag');
  }
}
