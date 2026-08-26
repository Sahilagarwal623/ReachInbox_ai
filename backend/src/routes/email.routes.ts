import { Router } from 'express';
import multer from 'multer';
import {
  handleScheduleBatch,
  handleGetScheduled,
  handleGetSent,
  handleCancel,
  handleParseCsv,
  handleGetStats,
} from '../controllers/email.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.post('/schedule', upload.single('file'), handleScheduleBatch);
router.get('/scheduled', handleGetScheduled);
router.get('/sent', handleGetSent);
router.post('/cancel/:id', handleCancel);
router.post('/parse-csv', upload.single('file'), handleParseCsv);
router.get('/stats', handleGetStats);

export default router;
