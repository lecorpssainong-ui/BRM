/**
 * Function: wellnessAdvisor
 * Entrypoint for the wellness advisor engine.
 * Supports standard local 0-credit engine and optional external integration model.
 */

export default async function (req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body?.question || '').trim().slice(0, 1200);
    if (!question) {
      return Response.json({ error: 'Question vide' }, { status: 400 });
    }

    const { runWellnessAdvisor } = await import('@/lib/wellnessAdvisorEngine');
    const result = await runWellnessAdvisor(body);
    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
