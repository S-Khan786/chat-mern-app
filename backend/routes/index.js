import express from 'express';
import { home } from '../controllers/home_controller.js';


const router = express.Router();

router.get('/', home);


//console.log('router loaded');

// Export the router
export default router;