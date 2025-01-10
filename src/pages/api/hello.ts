import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase } from '@/services/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        //await initializeDatabase();
        res.status(200).json({ message: 'Hello' });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        res.status(500).json({ error: 'Failed to initialize database' });
    }
}
