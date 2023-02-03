import { WebhookPayload } from '@actions/github/lib/interfaces';

interface PullRequestPayloadWithSha {
  pull_request: {
    head: {
      sha: string;
    };
  };
}

type WebhookPlayloadExtended = PullRequestPayloadWithSha & WebhookPayload;
