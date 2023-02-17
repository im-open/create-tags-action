import { isValidSemVer, isStableSemver } from './version-utils';

interface TargetTagOptions {
  canOverwrite?: boolean;
  canReferenceRelease?: boolean;
}

export default class TargetTag {
  readonly value: string;
  readonly isOverwritableIfExists: boolean;
  protected isVersion: boolean;

  readonly #canReferenceReleaseIfExists: boolean;
  #exists: boolean;
  #hasRelease: boolean;

  constructor(
    value: string,
    { canOverwrite = false, canReferenceRelease = false }: TargetTagOptions = {
      canOverwrite: false,
      canReferenceRelease: false
    }
  ) {
    if (!value?.trim()) throw new TypeError('value cannot be empty');

    this.value = value;
    this.isVersion = false;
    this.isOverwritableIfExists = canOverwrite;
    this.#canReferenceReleaseIfExists = canReferenceRelease;
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
    return !this.#exists || this.isOverwritableIfExists;
  }

  get hasRelease() {
    return this.#hasRelease;
  }

  get canReferenceReleaseIfExists() {
    return !this.#hasRelease || this.#canReferenceReleaseIfExists;
  }

  foundRelease() {
    this.#hasRelease = true;
  }

  toString() {
    return this.value;
  }

  static for(target: string, options?: TargetTagOptions): TargetVersionedTag | TargetTag {
    return isValidSemVer(target)
      ? new TargetVersionedTag(target, options)
      : new TargetTag(target, options);
  }
}

export class TargetVersionedTag extends TargetTag {
  constructor(value: string, options?: TargetTagOptions | undefined) {
    super(value, options);
    if (!isValidSemVer(value)) throw new TypeError(`value [${value}] must be a semver`);
  }

  get isStable() {
    return isStableSemver(this.value);
  }
}
