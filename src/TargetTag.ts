import semverParse from 'semver/functions/parse';
import SemVer from 'semver/classes/semver';
import { isSemver, isStableSemverVersion } from './version-utils';

interface TargetTagOptions {
  canOverwrite: boolean;
}

export default class TargetTag {
  readonly value: string;
  readonly isOverwritable: boolean;
  protected isVersion: boolean;
  #exists: boolean;
  #published: boolean;

  constructor(value: string, { canOverwrite = false }: TargetTagOptions = { canOverwrite: false }) {
    if (!value?.trim()) throw new TypeError('value cannot be empty');

    this.value = value;
    this.isVersion = false;
    this.isOverwritable = canOverwrite;
    this.#exists = false;
    this.#published = false;
  }

  get exists() {
    return this.#exists;
  }

  found() {
    this.#exists = true;
  }

  get canUpsert() {
    return this.isOverwritable || !this.exists;
  }

  get isPublished() {
    return this.#published;
  }

  markPublished() {
    this.#published = true;
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
  readonly #semVer: SemVer;

  constructor(value: string, options?: TargetTagOptions | undefined) {
    super(value, options);

    this.#semVer = semverParse(value);
    if (!isSemver(this.#semVer)) throw new TypeError(`value [${value}] must be a semver`);
  }

  get isStable() {
    return isStableSemverVersion(this.#semVer);
  }
}
