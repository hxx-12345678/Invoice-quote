import { Router } from 'express';
import { 
  getAllQuotes, 
  getQuoteById, 
  createQuote, 
  updateQuote, 
  deleteQuote 
} from '../controllers/quoteController';

const router = Router();

router.get('/', getAllQuotes);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

export default router;
