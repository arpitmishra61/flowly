// Known shape of what each action type writes back into zapRun.metadata
// after it runs successfully (see apps/worker/worker.ts). Used to offer
// autocomplete suggestions for actions configured later in the chain.
export const ACTION_OUTPUT_KEYS: Record<string, string[]> = {
  Github: [
    "github.number",
    "github.id",
    "github.title",
    "github.body",
    "github.html_url",
    "github.state",
    "github.user.login",
    "github.created_at",
  ],
  Gmail: ["gmail.messageId", "gmail.accepted", "gmail.envelope.from"],
};
