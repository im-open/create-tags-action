// https://www.npmjs.com/package/@actions/core
import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { WebhookPlayloadExtended } from './types';
import { validateSemverVersionFromTag, getMajorTag, getMajorAndMinorTag } from './version-utils';
import { tagExists, getShaFromTag, tagHasRelease, getRelease, createTag } from './api-utils';
import TargetTag, { TargetVersionedTag } from './TargetTag';

const token = core.getInput('github-token', { required: true });
core.setSecret(token);

const shaInput = core.getInput('sha');
const sourceTagInput = core.getInput('source-tag');
const targetTagInput = core.getInput('target-tag');
const additionalTargetTagInputs = core.getMultilineInput('additional-target-tags');

const includeMajorTag = core.getBooleanInput('include-major');
const includeMajorMinorTag = core.getBooleanInput('include-major-minor');
const includeLatestTag = core.getBooleanInput('include-latest');

const forceMainTargetTagCreation = core.getBooleanInput('force-target');
const forceAdditioanlTargetTagsCreation = core.getBooleanInput('force-additional-targets');

const failOnInvalidVersion = core.getBooleanInput('fail-on-invalid-version');
const targetTagsCanReferenceAnExistingRelease = !core.getBooleanInput('fail-on-associated-release');

function validateInputs() {
  if (!sourceTagInput && !targetTagInput && !additionalTargetTagInputs.length)
    throw new TypeError('A source-tag, target-tag or additional-target-tags must be provided');

  if (failOnInvalidVersion && sourceTagInput) validateSemverVersionFromTag(sourceTagInput);
  if (failOnInvalidVersion && targetTagInput) validateSemverVersionFromTag(targetTagInput);
}

function provisionTargetTags() {
  const targetTags = [];

  if (targetTagInput) {
    targetTags.push(
      TargetTag.for(targetTagInput, {
        canOverwrite: forceMainTargetTagCreation,
        canReferenceRelease: targetTagsCanReferenceAnExistingRelease
      })
    );
  }

  const referenceTag = targetTagInput || sourceTagInput;

  if (includeMajorTag && referenceTag) {
    const majorTag = getMajorTag(referenceTag);

    targetTags.push(TargetTag.for(majorTag, { canOverwrite: true, canReferenceRelease: true }));
    core.setOutput('major-tag', majorTag);
  }

  if (includeMajorMinorTag && referenceTag) {
    const majorMinorTag = getMajorAndMinorTag(referenceTag);

    targetTags.push(
      TargetTag.for(majorMinorTag, { canOverwrite: true, canReferenceRelease: true })
    );
    core.setOutput('major-minor-tag', majorMinorTag);
  }

  if (includeLatestTag && referenceTag) {
    targetTags.push(TargetTag.for('latest', { canOverwrite: true, canReferenceRelease: true }));
  }

  const additionalTargetTags = additionalTargetTagInputs
    .filter(tag => tag)
    .map(tag =>
      TargetTag.for(tag, {
        canOverwrite: forceAdditioanlTargetTagsCreation,
        canReferenceRelease: targetTagsCanReferenceAnExistingRelease
      })
    );

  return targetTags.concat(additionalTargetTags).sort();
}

async function resolveSha(octokit: InstanceType<typeof GitHub>) {
  if (shaInput) return shaInput;

  let sha;
  if (sourceTagInput) {
    sha = await getShaFromTag(octokit, sourceTagInput);
  }

  if (!sha) {
    sha =
      github.context.eventName === 'pull_request'
        ? (github.context.payload as WebhookPlayloadExtended).pull_request.head.sha
        : github.context.sha;
  }

  return sha;
}

async function run() {
  validateInputs();

  const octokit = github.getOctokit(token);
  if (sourceTagInput) {
    const release = await getRelease(octokit, sourceTagInput);
    if (release?.prerelease)
      throw new Error(
        `Release [${release.name}] is marked as pre-release. Updating tags from a pre-release is not supported.`
      );
  }

  const sha = await resolveSha(octokit);
  core.setOutput('sha', sha);

  const targetTags = provisionTargetTags();

  const tagsAsVersionsNotStable = targetTags.filter(
    tag => tag instanceof TargetVersionedTag && !tag.isStableVersion
  );

  if (tagsAsVersionsNotStable.length) {
    core.setFailed(`Unstable versioned tags [${tagsAsVersionsNotStable.join(', ')}]`);
    return;
  }

  console.debug(`Validating references [${targetTags.join(', ')}]...`);
  for (const tag of targetTags) {
    if (!(await tagExists(octokit, tag.value))) continue;

    tag.found();
    if (await tagHasRelease(octokit, tag.value)) tag.foundRelease();
  }

  // Tally up all failures instead of existing on first failure
  const failureMessages = [];

  const tagsAreNotOverwritable = targetTags.filter(tag => !tag.upsertable);
  if (tagsAreNotOverwritable.length) {
    failureMessages.push(
      `Unable to update existing tags [${tagsAreNotOverwritable.join(
        ', '
      )}]. You may force the update using the 'force-target' or 'force-additional-targets' flags.`
    );
  }

  const tagsWithRelease = targetTags.filter(tag => !tag.canReferenceReleaseIfExists);
  if (tagsWithRelease.length) {
    failureMessages.push(
      `Unable to update tags with an associated release [${tagsWithRelease.join(
        ', '
      )}]. You may force the update using the 'targets-can-reference-release' or 'force-additional-targets' flags.`
    );
  }

  if (failureMessages.length) {
    failureMessages.forEach(error => core.setFailed(error));
    return;
  }

  for (const tag of targetTags) {
    await createTag(octokit, tag, sha);
  }

  const tagsCreated = targetTags.filter(tag => !tag.exists);
  if (tagsCreated.length) console.info(`Tags [${tagsCreated.join(', ')}] created.`);

  const tagsUpdated = targetTags.filter(tag => tag.exists);
  if (tagsUpdated.length) console.info(`Tags [${tagsUpdated.join(', ')}] updated.`);

  core.info(
    `Tag${targetTags.length ? 's' : ''} now point${targetTags.length ? '' : 's'} to ${
      sourceTagInput || sha
    }!`
  );
  core.setOutput('tags', targetTags.join(','));
}

run().catch((error: Error) => {
  core.setFailed(error.message);
  throw error;
});
