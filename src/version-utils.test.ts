import * as system from './version-utils';

describe('Is version stable', () => {
  it('Validate if a version is stable', () => {
    expect(system.isStableSemver('v1.0.0')).toBe(true);
  });

  it('Validate if a version with build metadata is stable', () => {
    expect(system.isStableSemver('1.0.0+20130313144700')).toBe(true);
  });

  it('Validate if a pre-release version is not stable', () => {
    expect(system.isStableSemver('v1.0.0-beta.1')).toBe(false);
  });

  it('Validate if a pre-release version with build metadata is not stable', () => {
    expect(system.isStableSemver('v1.0.0-beta.1+20130313144700')).toBe(false);
  });
});

describe('Validate Semver from value', () => {
  it('Validate a value containing an valid semantic version', () => {
    expect(system.isValidSemVer('1.0.0')).toBe(true);
    expect(system.isStableSemver('1.0.0')).toBe(true);
  });

  it("Validate a value containing an valid semantic version with 'v' prefix", () => {
    expect(system.isValidSemVer('v1.0.0')).toBe(true);
    expect(system.isStableSemver('v1.0.0')).toBe(true);
  });

  it('Validate a value containing an valid semantic version with build metadata', () => {
    expect(system.isValidSemVer('v1.0.0+20130313144700')).toBe(true);
    expect(system.isStableSemver('v1.0.0+20130313144700')).toBe(true);
  });

  it('Validate a value containing an valid semantic major version', () => {
    expect(system.canCoerceAsSemver('v1')).toBe(true);
  });

  it('Validate a value containing an valid semantic major + minior version', () => {
    expect(system.canCoerceAsSemver('v1.1')).toBe(true);
  });

  it('Value not able to be coerced', () => {
    expect(system.canCoerceAsSemver('invalid')).toBe(false);
  });

  it('Invalid when a value contains an invalid semantic version', () => {
    expect(system.isValidSemVer('1.0.0invalid')).toBe(false);
    expect(system.isStableSemver('1.0.0invalid')).toBe(false);
  });

  it('Invalid when a value contains a incomplete semantic version', () => {
    expect(system.isValidSemVer('v1')).toBe(false);
    expect(system.isStableSemver('v1')).toBe(false);
  });

  it('Invalid when a value contains an valid unstable semantic version', () => {
    expect(system.isValidSemVer('v1.0.0-beta.1')).toBe(true);
    expect(system.isStableSemver('v1.0.0-beta.1')).toBe(false);
  });

  it('Invalid when a value contains an valid unstable semantic version with build metadata', () => {
    expect(system.isValidSemVer('v1.0.0-beta.1+20130313144700')).toBe(true);
    expect(system.isStableSemver('v1.0.0-beta.1+20130313144700')).toBe(false);
  });
});

describe('Get Major and Minor versions', () => {
  describe('get a valid major value', () => {
    it.each([
      ['1.0.0', '1'],
      ['v1.0.0', 'v1'],
      ['v1.0.0+20130313144700', 'v1']
    ])('%s -> %s', (value: string, expected: string) => {
      const result = system.getMajor(value);
      expect(result).toBe(expected);
    });
  });

  describe('Get a valid major and minor value', () => {
    it.each([
      ['1.0.0', '1.0'],
      ['v1.0.0', 'v1.0'],
      ['v1.0.0+20130313144700', 'v1.0']
    ])('%s -> %s', (value: string, expected: string) => {
      const result = system.getMajorAndMinor(value);
      expect(result).toBe(expected);
    });
  });

  describe('Fail major and minor resolution on invalid semVer value', () => {
    it.each(['a.b.c', 'v1', '1', 'v1.0.0-beta.1'])('%s -> %s', (value: string) => {
      expect(() => system.getMajorAndMinor(value)).toThrow(
        `Tag [${value}] doesn't satisfy semantic versioning specification`
      );
    });
  });
});
