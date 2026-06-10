import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { tagsTable } from "@workspace/db";
import {
  CreateTagBody,
  ListTagsResponse,
  UpdateTagParams,
  UpdateTagBody,
  DeleteTagParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/tags", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const tags = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.userId, userId))
    .orderBy(tagsTable.name);

  res.json(
    ListTagsResponse.parse(
      tags.map((t) => ({
        id: String(t.id),
        name: t.name,
        color: t.color,
        createdAt: t.createdAt,
      }))
    )
  );
});

router.post("/tags", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tag] = await db
    .insert(tagsTable)
    .values({ userId, name: parsed.data.name, color: parsed.data.color })
    .returning();

  res.status(201).json({
    id: String(tag!.id),
    name: tag!.name,
    color: tag!.color,
    createdAt: tag!.createdAt,
  });
});

router.patch("/tags/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = UpdateTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tag] = await db
    .update(tagsTable)
    .set(parsed.data)
    .where(
      and(eq(tagsTable.id, Number(params.data.id)), eq(tagsTable.userId, userId))
    )
    .returning();

  if (!tag) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }

  res.json({ id: String(tag.id), name: tag.name, color: tag.color, createdAt: tag.createdAt });
});

router.delete("/tags/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = DeleteTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(tagsTable)
    .where(
      and(eq(tagsTable.id, Number(params.data.id)), eq(tagsTable.userId, userId))
    );

  res.sendStatus(204);
});

export default router;
