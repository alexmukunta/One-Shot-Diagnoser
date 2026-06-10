import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnoseRouter from "./diagnose";
import dashboardRouter from "./dashboard";
import monitorsRouter from "./monitors";
import incidentsRouter from "./incidents";
import alertChannelsRouter from "./alert-channels";
import statusPagesRouter from "./status-pages";
import tagsRouter from "./tags";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diagnoseRouter);
router.use(dashboardRouter);
router.use(monitorsRouter);
router.use(incidentsRouter);
router.use(alertChannelsRouter);
router.use(statusPagesRouter);
router.use(tagsRouter);

export default router;
