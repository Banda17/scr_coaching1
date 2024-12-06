import express from 'express';
import { requireRole } from '../auth';
import { UserRole } from '@db/schema';
import fetch from 'node-fetch';

const router = express.Router();

// Helper function to parse CSV data
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      return {
        trainNumber: values[0] || '-',
        type: values[1] || '-',
        status: values[2] || '-',
        from: values[3] || '-',
        to: values[4] || '-',
        scheduledDeparture: values[5] || '-',
        actualDeparture: values[6] || '-',
        scheduledArrival: values[7] || '-',
        actualArrival: values[8] || '-',
        lastUpdated: values[9] || '-'
      };
    });
}

router.get('/csv', async (req, res) => {
  try {
    const csvUrl = process.env.CSV_URL;
    if (!csvUrl) {
      console.error('[CSV] Missing CSV_URL environment variable');
      return res.status(500).json({
        error: 'CSV configuration is not properly set up'
      });
    }

    try {
      console.log('[CSV] Attempting to fetch data from CSV source');
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        console.error(`[CSV] Failed to fetch data: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({
          error: `Failed to fetch CSV data: ${response.statusText}`
        });
      }

      const csvText = await response.text();
      console.log('[CSV] Successfully fetched CSV data, parsing...');
      const data = parseCSV(csvText);
      console.log(`[CSV] Parsed ${data.length} records`);

      return res.json(data);
    } catch (error) {
      console.error('[CSV] Error processing CSV data:', error);
      return res.status(500).json({
        error: 'Failed to process train schedule data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  } catch (error) {
    console.error('[CSV] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
