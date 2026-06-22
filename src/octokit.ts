import { getOctokit } from '@actions/github';

export type GitHubOctokit = ReturnType<typeof getOctokit>;
