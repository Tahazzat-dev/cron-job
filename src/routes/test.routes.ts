import { Router, Request, Response } from 'express';
import { addRedisValue,
    getRedisValue,
    updateRedisValue} from "../controllers/testRedisController"
import AdminConfig from '../models/AdminConfig';

const router = Router();

// POST: Set value
router.post('/set-interval-value', async(req,res)=>{
    const {interval} = req.body
    try {
        const configVal = new AdminConfig({autoCronIntervalSec:interval})
    } catch (error) {
        console.log(error)
    }
    return res.status(200).json({ success: 'Test route is working' });
});
router.post('/set-redis-val', addRedisValue);

// GET: Get value
router.get('/get-redis-val', getRedisValue);

// PUT: Update value
router.put('/update-redis-val',updateRedisValue);

export default router;