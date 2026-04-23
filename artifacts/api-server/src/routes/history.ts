import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, workoutHistory } from "@workspace/db";
import { and, eq, asc } from "drizzle-orm";

const router: IRouter = Router();

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = (auth?.sessionClaims?.userId as string | undefined) ?? auth?.userId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/history", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(workoutHistory)
    .where(eq(workoutHistory.userId, userId))
    .orderBy(asc(workoutHistory.ts));
  res.json(
    rows.map((r) => ({
      ts: r.ts,
      muscles: r.muscles,
      focus: r.focus ?? undefined,
    })),
  );
});

router.post("/history", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { ts, muscles, focus } = req.body ?? {};
  if (typeof ts !== "number" || !Array.isArray(muscles)) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  await db.insert(workoutHistory).values({
    userId,
    ts,
    muscles: muscles.filter((m: unknown): m is string => typeof m === "string"),
    focus: typeof focus === "string" ? focus : null,
  });
  res.json({ ok: true });
});

router.delete("/history", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;
  await db.delete(workoutHistory).where(eq(workoutHistory.userId, userId));
  res.json({ ok: true });
});

router.post("/history/bulk", requireAuth, async (req: AuthedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) {
    res.json({ ok: true, inserted: 0 });
    return;
  }
  const rows = items
    .filter((it: { ts?: unknown; muscles?: unknown }) => typeof it?.ts === "number" && Array.isArray(it?.muscles))
    .map((it: { ts: number; muscles: unknown[]; focus?: unknown }) => ({
      userId,
      ts: it.ts,
      muscles: it.muscles.filter((m: unknown): m is string => typeof m === "string"),
      focus: typeof it.focus === "string" ? it.focus : null,
    }));
  if (rows.length > 0) await db.insert(workoutHistory).values(rows);
  res.json({ ok: true, inserted: rows.length });
});

// Use this so we can find unused vars in tests
void and;

export default router;
