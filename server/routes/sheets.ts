import express from 'express';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import path from 'path';

const router = express.Router();

interface TrainScheduleRow {
  trainNumber: string;
  type: string;
  status: string;
  from: string;
  to: string;
  scheduledDeparture: string;
  actualDeparture: string;
  scheduledArrival: string;
  actualArrival: string;
  lastUpdated: string;
}

async function getAuthClient() {
  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    if (!credentialsPath) {
      console.error('[Sheets] Google credentials path not configured');
      throw new Error('GOOGLE_CREDENTIALS_PATH environment variable is missing');
    }

    console.log('[Sheets] Attempting to authenticate with Google');
    const auth = await authenticate({
      keyfilePath: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });
    console.log('[Sheets] Authentication successful');

    return auth;
  } catch (error) {
    console.error('[Sheets] Authentication error:', error);
    if (error instanceof Error) {
      throw new Error(`Google Sheets authentication failed: ${error.message}`);
    }
    throw error;
  }
}

async function fetchSheetData(): Promise<TrainScheduleRow[]> {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      console.error('[Sheets] GOOGLE_SHEET_ID environment variable is missing');
      throw new Error('Google Sheet ID not configured');
    }

    console.log('[Sheets] Fetching data from spreadsheet:', spreadsheetId);
    const range = 'A1:J'; // Headers in first row plus data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.warn('[Sheets] No data found in the sheet');
      return [];
    }

    console.log(`[Sheets] Found ${rows.length - 1} data rows`);
    
    // Validate header row
    const headers = rows[0];
    const expectedHeaders = ['Train Number', 'Type', 'Status', 'From', 'To', 'Scheduled Departure', 'Actual Departure', 'Scheduled Arrival', 'Actual Arrival', 'Last Updated'];
    const hasValidHeaders = expectedHeaders.every((header, index) => 
      headers[index]?.toString().toLowerCase().replace(/\s+/g, '') === header.toLowerCase().replace(/\s+/g, '')
    );

    if (!hasValidHeaders) {
      console.error('[Sheets] Invalid sheet headers:', headers);
      throw new Error('Sheet headers do not match expected format');
    }

    // Skip header row and map to our interface with validation
    return rows.slice(1).map((row, index) => {
      if (row.length < 10) {
        console.warn(`[Sheets] Row ${index + 2} has missing data:`, row);
      }
      
      return {
        trainNumber: row[0]?.toString() || '',
        type: row[1]?.toString() || '',
        status: row[2]?.toString() || '',
        from: row[3]?.toString() || '',
        to: row[4]?.toString() || '',
        scheduledDeparture: row[5]?.toString() || '',
        actualDeparture: row[6]?.toString() || '',
        scheduledArrival: row[7]?.toString() || '',
        actualArrival: row[8]?.toString() || '',
        lastUpdated: row[9]?.toString() || ''
      };
    });
  } catch (error) {
    console.error('[Sheets] Error fetching sheet data:', error);
    throw error;
  }
}

router.get('/data', async (req, res) => {
  try {
    console.log('[Sheets] Fetching train schedule data from Google Sheets');
    
    // Add caching headers
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    const data = await fetchSheetData();
    console.log(`[Sheets] Successfully fetched ${data.length} records`);

    // Return formatted response
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('[Sheets] Error in /data endpoint:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        statusCode = 401;
        errorMessage = 'Authentication failed';
      } else if (error.message.includes('not configured')) {
        statusCode = 503;
        errorMessage = 'Service not properly configured';
      } else if (error.message.includes('headers')) {
        statusCode = 400;
        errorMessage = 'Invalid sheet format';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

export default router;
