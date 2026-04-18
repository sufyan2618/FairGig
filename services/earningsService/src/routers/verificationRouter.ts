import { Router } from 'express';

import {
  getVerificationById,
  getVerificationHistory,
  getVerificationQueue,
  submitVerificationDecision,
} from '../controllers/verificationController.js';
import { requireAuth } from '../middlewares/auth.js';

const verificationRouter = Router();

verificationRouter.get('/verifications/queue', requireAuth('verifier'), getVerificationQueue);
verificationRouter.get('/verifications/history', requireAuth('verifier'), getVerificationHistory);
verificationRouter.get('/verifications/:id', requireAuth('verifier'), getVerificationById);
verificationRouter.post('/verifications/:id/decision', requireAuth('verifier'), submitVerificationDecision);

export default verificationRouter;
