import { Router, type IRouter } from "express";
import { DiagnoseUrlBody, DiagnoseUrlResponse } from "@workspace/api-zod";
import { diagnoseUrl } from "../lib/checker";
import { validateNoSsrf } from "../lib/ssrf";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/diagnose", requireAuth, async (req, res): Promise<void> => {
  const parsed = DiagnoseUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    await validateNoSsrf(parsed.data.url);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }

  const result = await diagnoseUrl(parsed.data.url);
  res.json(DiagnoseUrlResponse.parse(result));
});

export default router;
