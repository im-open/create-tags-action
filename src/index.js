// https://www.npmjs.com/package/@actions/core
import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  tagExists,
  getShaFromTag,
  isTaggedReleasePublished,
  validateIfTaggedReleaseIsPublished,
  createTag
} from './api';
import { validateSemverVersionFromTag, getMajorTag, getMajorMinorTag } from './version';
import TargetTag from './TargetTag';

const token = core.getInput('github-token', { required: true });
core.setSecret(token);

const shaInput = core.getInput('sha');
const sourceTagInput = core.getInput('source-tag');
const targetTagInput = core.getInput('target-tag');
const targetTagsInput = core.getMultilineInput('target-tags');

const includeMajorTag = core.getBooleanInput('include-major-tag');
const includeMajorMinorTag = core.getBooleanInput('include-major-minor-tag');

const forceMainTargetTagCreation = core.getBooleanInput('force-target-tag');
const forceTargetTagsCreation = core.getBooleanInput('force-target-tags');

const failOnInvalidVersion = core.getBooleanInput('fail-on-invalid-version');

function validateInputs() {
  if (!shaInput && !sourceTagInput) throw new TypeError('A sha or source-tag is required');

  if (shaInput && sourceTagInput)
    throw new TypeError('A sha and source-tag cannot be included together');

  if (shaInput && (includeMajorTag || includeMajorMinorTag))
    throw new TypeError(
      'A major or major-minor tag cannot be automatically generated from a sha, you must provide a source-tag instead.'
    );

  if (failOnInvalidVersion && sourceTagInput) validateSemverVersionFromTag(sourceTagInput);
}

function provisionTargetTags() {
  const targetTags = targetTagsInput
    .filter(tag => tag)
    .map(tag => TargetTag.for(tag, { canOverwrite: forceTargetTagsCreation }));

  if (targetTagInput) {
    targetTags.push(TargetTag.for(targetTagInput, { canOverwrite: forceMainTargetTagCreation }));
  }

  if (includeMajorTag) {
    const majorTag = getMajorTag(sourceTagInput);
    targetTags.push(TargetTag.for(majorTag, { canOverwrite: true }));
    core.setOutput('major-tag', majorTag);
  }

  if (includeMajorMinorTag) {
    const majorMinorTag = getMajorMinorTag(sourceTagInput);
    targetTags.push(TargetTag.for(majorMinorTag, { canOverwrite: true }));
    core.setOutput('major-minor-tag', majorMinorTag);
  }

  return targetTags;
}

async function run() {
  validateInputs();

  const octokit = github.getOctokit(token);
  if (sourceTagInput) await validateIfTaggedReleaseIsPublished(octokit, sourceTagInput);

  const sha = shaInput ?? (await getShaFromTag(octokit, sourceTagInput));

  const targetTags = provisionTargetTags();

  if (targetTags.some(tag => !tag.isStable)) {
    core.setFailed(
      `Unstable versioned-target tags [${targetTags.filer(tag => tag.cannotReplace).join(', ')}]`
    );
    return;
  }

  for (const tag of targetTags) {
    if (await isTaggedReleasePublished(octokit, tag)) tag.markPublished();

    if (await tagExists(octokit, tag)) tag.found();
  }

  const errors = [];
  if (targetTags.some(tag => !tag.canUpsert)) {
    errors.push(
      `Unable to update existing tags [${targetTags.filter(tag => !tag.canUpsert).join(', ')}]`
    );
  }

  if (targetTags.some(tag => !tag.isPublished)) {
    errors.push(
      `Unable to update pre-released tags [${targetTags
        .filter(tag => !tag.isPublished)
        .join(', ')}]`
    );
  }

  if (errors.length) {
    errors.forEach(error => core.setFailed(error));
    return;
  }

  targetTags.forEach(tag => createTag(tag));
  core.info(`Tags [${targetTags.join(', ')}] now point to ${sourceTagInput || sha}`);
}

run().catch(error => {
  core.setFailed(error.message);
  throw error;
});
