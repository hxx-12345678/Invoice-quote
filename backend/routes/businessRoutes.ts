import { Router } from 'express';
import { 
  getBusinessProfile, 
  createBusinessProfile, 
  updateBusinessProfile 
} from '../controllers/businessController';

const router = Router();

router.get('/', getBusinessProfile);
router.post('/', createBusinessProfile);
router.put('/', updateBusinessProfile);

export default router;
