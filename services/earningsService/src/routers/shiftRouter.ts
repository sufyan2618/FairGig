import { Router } from 'express';

import {
  createShift,
  deleteShift,
  downloadCsvTemplate,
  getShiftById,
  getShiftScreenshot,
  importShiftsCsv,
  listShifts,
  updateShift,
  uploadShiftScreenshot,
} from '../controllers/shiftController.js';
import { requireAuth, requireWorkerOrInternal } from '../middlewares/auth.js';
import { csvUpload, screenshotUpload } from '../utils/files.js';

const shiftRouter = Router();

shiftRouter.get('/shifts/import/template', requireAuth('worker'), downloadCsvTemplate);
shiftRouter.post('/shifts/import', requireAuth('worker'), csvUpload.single('file'), importShiftsCsv);

shiftRouter.post('/shifts', requireAuth('worker'), createShift);
shiftRouter.get('/shifts', requireWorkerOrInternal, listShifts);
shiftRouter.get('/shifts/:id', requireAuth('worker'), getShiftById);
shiftRouter.put('/shifts/:id', requireAuth('worker'), updateShift);
shiftRouter.delete('/shifts/:id', requireAuth('worker'), deleteShift);

shiftRouter.post('/shifts/:id/screenshot', requireAuth('worker'), screenshotUpload.single('screenshot'), uploadShiftScreenshot);
shiftRouter.get('/shifts/:id/screenshot', requireAuth('worker', 'verifier'), getShiftScreenshot);

export default shiftRouter;
