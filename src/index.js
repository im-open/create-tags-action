// https://www.npmjs.com/package/@actions/core
import * as core from '@actions/core';
import * as github from '@actions/github';
import { validateSemverVersionFromTag, getMajorTag, getMajorAndMinorTag } from './version-utils';
import {
  tagExists,
  getShaFromTag,
  isTaggedReleasePublished,
  validateIfTaggedReleaseIsPublished,
  createTag
} from './api-utils';
import TargetTag, { TargetVersionedTag } from './TargetTag';

const token = core.getInput('github-token', { required: true });
core.setSecret(token);

const shaInput = core.getInput('sha');
const sourceTagInput = core.getInput('source-tag');
const targetTagInput = core.getInput('target-tag');
const additionalTargetTagInputs = core.getMultilineInput('additional-target-tags');

const includeMajorTag = core.getBooleanInput('include-major');
const includeMajorMinorTag = core.getBooleanInput('include-major-minor');

const forceMainTargetTagCreation = core.getBooleanInput('force-target');
const forceAdditioanlTargetTagsCreation = core.getBooleanInput('force-additional-targets');

const failOnInvalidVersion = core.getBooleanInput('fail-on-invalid-version');

function validateInputs() {
  if (!sourceTagInput && !targetTagInput && !additionalTargetTagInputs.length)
    throw new TypeError('A source-tag, target-tag or additional-target-tags must be provided');

  if (shaInput && sourceTagInput)
    throw new TypeError('A sha and source-tag cannot be included together');

  if (failOnInvalidVersion && sourceTagInput) validateSemverVersionFromTag(sourceTagInput);
  if (failOnInvalidVersion && targetTagInput) validateSemverVersionFromTag(targetTagInput);
}

function provisionTargetTags() {
  const targetTags = [];

  if (targetTagInput) {
    console.debug(`Processsing target-tag [${targetTagInput}]`);
    targetTags.push(TargetTag.for(targetTagInput, { canOverwrite: forceMainTargetTagCreation }));
  }

  const referenceTag = targetTagInput || sourceTagInput;

  if (includeMajorTag && referenceTag) {
    const majorTag = getMajorTag(referenceTag);
    console.debug(`Processsing major-tag [${majorTag}]`);

    targetTags.push(TargetTag.for(majorTag, { canOverwrite: true }));
    core.setOutput('major-tag', majorTag);
  }

  if (includeMajorMinorTag && referenceTag) {
    const majorMinorTag = getMajorAndMinorTag(referenceTag);

    console.debug(`Processsing major-minor tag [${majorMinorTag}]`);
    targetTags.push(TargetTag.for(majorMinorTag, { canOverwrite: true }));
    core.setOutput('major-minor-tag', majorMinorTag);
  }

  const additionalTargetTags = additionalTargetTagInputs
    .filter(tag => tag)
    .map(tag => TargetTag.for(tag, { canOverwrite: forceAdditioanlTargetTagsCreation }));

  console.debug(`Processing additional tags [${additionalTargetTags.join(', ')}]`);

  return targetTags.concat(additionalTargetTags);
}

async function run() {
  validateInputs();

  const octokit = github.getOctokit(token);
  if (sourceTagInput) await validateIfTaggedReleaseIsPublished(octokit, sourceTagInput);

  const sha =
    shaInput ??
    (await getShaFromTag(octokit, sourceTagInput)) ??
    github.context.eventName === 'pull_request'
      ? github.context.payload.pull_request.head.sha
      : github.context.sha;

  core.setOutput('sha', sha);

  const targetTags = provisionTargetTags();

  const tagsAsVersionsNotStable = targetTags.filter(
    tag => tag instanceof TargetVersionedTag && !tag.isStableVersion
  );

  if (tagsAsVersionsNotStable.length) {
    core.setFailed(`Unstable versioned-target tags [${tagsAsVersionsNotStable.join(', ')}]`);
    return;
  }

  for (const tag of targetTags) {
    if (await isTaggedReleasePublished(octokit, tag)) tag.markPublished();
    if (await tagExists(octokit, tag)) tag.found();
  }

  // Tally up all failures instead of existing on first failure
  const failureMessages = [];

  const tagsAreNotOverwrittable = targetTags.filter(tag => !tag.canUpsert);
  if (tagsAreNotOverwrittable.length) {
    failureMessages.push(`Unable to update existing tags [${tagsAreNotOverwrittable.join(', ')}]`);
  }

  const tagsAreNotPublished = targetTags.filter(tag => !tag.isPublished);
  if (tagsAreNotPublished.length) {
    failureMessages.push(`Unable to update pre-released tags [${tagsAreNotPublished.join(', ')}]`);
  }

  if (failureMessages.length) {
    failureMessages.forEach(error => core.setFailed(error));
    return;
  }

  targetTags.forEach(tag => createTag(tag));
  core.info(`Tags [${targetTags.join(', ')}] now point to ${sourceTagInput || sha}`);
}

run().catch(error => {
  core.setFailed(error.message);
  throw error;
});
