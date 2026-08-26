import { Router } from 'express';
import { loginOrSyncUser, getProfile } from '../controllers/auth.controller';

const router = Router();

router.post('/google', loginOrSyncUser);
router.get('/me', getProfile);

export default router;
