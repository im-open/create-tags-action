import * as system from './version-utils';

const stableSemver = {
  options: {},
  loose: false,
  includePrerelease: false,
  raw: 'v1.0.0',
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: [],
  version: '1.0.0'
};

const stableBuildSemver = {
  options: {},
  loose: false,
  includePrerelease: false,
  raw: '1.0.0+20130313144700',
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: ['20130313144700'],
  version: '1.0.0'
};

const preReleaseSemver = {
  options: {},
  loose: false,
  includePrerelease: false,
  raw: 'v1.0.0-beta.1',
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: ['beta', 1],
  build: [],
  version: '1.0.0-beta.1'
};

const preReleaseBuildSemver = {
  options: {},
  loose: false,
  includePrerelease: false,
  raw: 'v1.0.0-beta.1+20130313144700',
  major: 1,
  minor: 0,
  patch: 0,
  prerelease: ['beta', 1],
  build: ['20130313144700'],
  version: '1.0.0-beta.1'
};

describe('Is version stable', () => {
  it('validate if a version is stable', () => {
    const semverVersion = stableSemver;
    expect(system.isStableSemverVersion(semverVersion)).toBeTruthy();
  });

  it('validate if a version with build metadata is stable', () => {
    const semverVersion = stableBuildSemver;
    expect(system.isStableSemverVersion(semverVersion)).toBeTruthy();
  });

  it('validate if a pre-release version is not stable', () => {
    const semverVersion = preReleaseSemver;
    expect(system.isStableSemverVersion(semverVersion)).toBeFalsy();
  });

  it('validate if a pre-release version with build metadata is not stable', () => {
    const semverVersion = preReleaseBuildSemver;
    expect(system.isStableSemverVersion(semverVersion)).toBeFalsy();
  });
});

describe('Validate Semver from tag', () => {
  it('validate a tag containing an valid semantic version', () => {
    expect(() => system.validateSemverVersionFromTag('1.0.0')).not.toThrow();
  });

  it("validate a tag containing an valid semantic version with 'v' prefix", () => {
    expect(() => system.validateSemverVersionFromTag('v1.0.0')).not.toThrow();
  });

  it('validate a tag containing an valid semantic version with build metadata', () => {
    expect(() => system.validateSemverVersionFromTag('v1.0.0+20130313144700')).not.toThrow();
  });

  it('throw when a tag contains an invalid semantic version', () => {
    expect(() => system.validateSemverVersionFromTag('1.0.0invalid')).toThrowError(
      "Tag [1.0.0invalid] doesn't satisfy semantic versioning specification"
    );
  });

  it('throw when a tag contains an valid unstable semantic version', () => {
    expect(() => system.validateSemverVersionFromTag('v1.0.0-beta.1')).toThrowError(
      'It is not allowed to specify pre-release version tag [v1.0.0-beta.1]'
    );
  });

  it('throw when a tag contains an valid unstable semantic version with build metadata', () => {
    expect(() => system.validateSemverVersionFromTag('v1.0.0-beta.1+20130313144700')).toThrowError(
      'It is not allowed to specify pre-release version tag [v1.0.0-beta.1+20130313144700]'
    );
  });
});

describe('Get Major and Minor versions', () => {
  describe('get a valid major tag from full tag', () => {
    it.each([
      ['1.0.0', '1'],
      ['v1.0.0', 'v1'],
      ['v1.0.0-beta.1', 'v1'],
      ['v1.0.0+20130313144700', 'v1']
    ] as [string, string][])('%s -> %s', (tag: string, expected: string) => {
      const result = system.getMajorTag(tag);
      expect(result).toBe(expected);
    });
  });

  describe('get a valid major and minor tag from full tag', () => {
    it.each([
      ['1.0.0', '1.0'],
      ['v1.0.0', 'v1.0'],
      ['v1.1.0-beta.1', 'v1.1'],
      ['v1.0.0+20130313144700', 'v1.0']
    ] as [string, string][])('%s -> %s', (tag: string, expected: string) => {
      const result = system.getMajorAndMinorTag(tag);
      expect(result).toBe(expected);
    });
  });
});
