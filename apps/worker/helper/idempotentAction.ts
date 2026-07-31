import db from "@repo/db/client";

// Runs `action` (a call to sendMail/createIssue or similar non-idempotent
// side effect) at most once per (zapRunId, sortingOrder). On Kafka
// redelivery of an already-processed stage, returns the previously recorded
// result instead of calling out again.
export default async function runIdempotentAction(
  zapRunId: number,
  sortingOrder: number,
  action: () => Promise<any>,
): Promise<any> {
  const existing = await db.actionExecution.findUnique({
    where: { zapRunId_sortingOrder: { zapRunId, sortingOrder } },
  });
  if (existing) {
    console.log(
      `Action already executed for zapRun ${zapRunId} stage ${sortingOrder} — skipping duplicate send`,
    );
    return existing.result;
  }

  const result = await action();
  if (!result) return result;

  try {
    await db.actionExecution.create({
      data: { zapRunId, sortingOrder, result },
    });
  } catch (err: any) {
    if (err?.code !== "P2002") throw err;
    // Lost a race with a concurrent redelivery that recorded this execution
    // first — the send already happened exactly once either way, fine.
  }

  return result;
}
