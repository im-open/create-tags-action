import semverParse from 'semver/functions/parse';
import SemVer from 'semver/classes/semver';
import { isSemver, isStableSemverVersion } from './version-utils';

interface TargetTagOptions {
  canOverwrite: boolean;
}

export default class TargetTag {
  readonly value: string;
  readonly isOverwritableIfExists: boolean;
  protected isVersion: boolean;
  #exists: boolean;
  #hasRelease: boolean;

  constructor(value: string, { canOverwrite = false }: TargetTagOptions = { canOverwrite: false }) {
    if (!value?.trim()) throw new TypeError('value cannot be empty');

    this.value = value;
    this.isVersion = false;
    this.isOverwritableIfExists = canOverwrite;
    this.#exists = false;
    this.#hasRelease = false;
  }

  get exists() {
    return this.#exists;
  }

  found() {
    this.#exists = true;
  }

  get upsertable() {
    return this.isOverwritableIfExists || !this.exists;
  }

  get hasRelease() {
    return this.#hasRelease;
  }

  foundRelease() {
    this.#hasRelease = true;
  }

  toString() {
    return this.value;
  }

  static for(target: string, options?: TargetTagOptions) {
    return isSemver(target)
      ? new TargetVersionedTag(target, options)
      : new TargetTag(target, options);
  }
}

export class TargetVersionedTag extends TargetTag {
  readonly #semver: SemVer;

  constructor(value: string, options?: TargetTagOptions | undefined) {
    super(value, options);

    const semver = semverParse(value);
    if (!isSemver(semver)) throw new TypeError(`value [${value}] must be a semver`);
    this.#semver = semver as SemVer;
  }

  get isStableVersion() {
    return isStableSemverVersion(this.#semver);
  }
}
