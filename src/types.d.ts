export interface PullRequestPayloadWithSha {
  pull_request: {
    head: {
      sha: string;
    };
  };
}
