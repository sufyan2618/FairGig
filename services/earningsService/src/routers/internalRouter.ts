import { Router } from 'express';

import { getAggregateMedian, getWorkerSummary } from '../controllers/internalController.js';
import { requireInternalApiKey } from '../middlewares/auth.js';

const internalRouter = Router();

internalRouter.get('/shifts/summary/:workerId', requireInternalApiKey, getWorkerSummary);
internalRouter.get('/shifts/aggregate/median', requireInternalApiKey, getAggregateMedian);

export default internalRouter;
