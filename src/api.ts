import * as core from '@actions/core';
import { context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { RequestError } from '@octokit/types';
import TargetTag from './TargetTag';

async function getTag(octokit: InstanceType<typeof GitHub>, tag: string) {
  try {
    // https://octokit.github.io/rest.js/v18#git-get-ref
    // https://docs.github.com/en/rest/reference/git#get-a-reference
    const { data: foundTag } = await octokit.rest.git.getRef({
      ...context.repo,
      ref: `tags/${tag}`
    });

    return foundTag;
  } catch (e) {
    if ((e as RequestError).status === 404) return null;
    throw new Error(`Retrieving refs failed with the following error: ${e}`);
  }
}

export async function tagExists(octokit: InstanceType<typeof GitHub>, tag: string) {
  return (await getTag(octokit, tag)) ? true : false;
}

export async function getShaFromTag(octokit: InstanceType<typeof GitHub>, tag: string) {
  const foundTag = await getTag(octokit, tag);
  if (!foundTag) throw new Error(`The tag [${tag}] does not exist. Unable to get sha.`);
  return foundTag.object.sha;
}

export async function isTaggedReleasePublished(octokit: InstanceType<typeof GitHub>, tag: string) {
  try {
    const { data: foundRelease } = await octokit.rest.repos.getReleaseByTag({
      ...context.repo,
      tag
    });

    return !foundRelease.prerelease;
  } catch (e) {
    throw new Error(`Retrieving releases failed with the following error: ${e}`);
  }
}

export async function validateIfTaggedReleaseIsPublished(
  octokit: InstanceType<typeof GitHub>,
  tag: string
) {
  try {
    const { data: foundRelease } = await octokit.rest.repos.getReleaseByTag({
      ...context.repo,
      tag
    });

    if (!foundRelease.prerelease) return;

    throw new Error(
      `Release ['${foundRelease.name}'] is marked as pre-release. Updating tags for pre-release is not supported.`
    );
  } catch (e) {
    if ((e as RequestError).status === 404) {
      throw new Error(`No GitHub release found for the [${tag}] tag`);
    }
    throw new Error(`Retrieving releases failed with the following error: ${e}`);
  }
}

export async function createTag(octokit: InstanceType<typeof GitHub>, tag: TargetTag, sha: string) {
  core.info(`Generating the ref [${tag}] on GitHub...`);

  if (!tag.isOverwritable && tag.exists) throw new Error(`Reference tag [${tag}] already exists`);

  const payload = {
    ...context.repo,
    sha
  };

  if (tag.exists) {
    await octokit.rest.git.updateRef({
      ...payload,
      ref: `tags/${tag}`,
      force: true
    });

    core.info('Finished updating the tag.');
    return;
  }

  await octokit.rest.git.createRef({
    ...payload,
    ref: `refs/tags/${tag}`
  });

  core.info('Finished creating the tag.');
}
