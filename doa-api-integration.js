/**
 * DOA CROPIX API Integration
 * VegWaste Sri Lanka - Agricultural Data Integration
 */

const axios = require('axios');
const NodeCache = require('node-cache');

// ============================================================================
// PART 1: Environment Setup & Configuration
// ============================================================================

const DOA_API_CONFIG = {
  baseUrl: process.env.DOA_API_BASE_URL || 'https://api.doa.gov.lk/v1',
  apiKey: process.env.DOA_API_KEY,
  authToken: process.env.DOA_AUTH_TOKEN,
  timeout: 10000,
  retryAttempts: 3,
  cacheDuration: 3600 // 1 hour
};

// Initialize cache for API responses
const apiCache = new NodeCache({ stdTTL: 3600 });

// ============================================================================
// PART 2: District Production API Endpoint
// ============================================================================

/**
 * Fetch district-wise production data from DOA CROPIX
 * POST /api/doa/district-production
 * Body: { district, season, year }
 */
function setupDistrictProductionEndpoint(app) {
  app.post('/api/doa/district-production', async (req, res) => {
    try {
      const { district, season, year } = req.body;
      
      // Validate inputs
      if (!district || !season || !year) {
        return res.status(400).json({ 
          error: 'Missing required fields: district, season, year' 
        });
      }

      // Check cache first
      const cacheKey = `production_${district}_${season}_${year}`;
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        return res.json({ 
          data: cachedData, 
          source: 'cache',
          timestamp: new Date()
        });
      }

      // Fetch from DOA CROPIX API
      const response = await axios.get(`${DOA_API_CONFIG.baseUrl}/production`, {
        headers: {
          'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
          'X-API-Key': DOA_API_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        params: {
          district: district,
          season: season,
          year: year
        },
        timeout: DOA_API_CONFIG.timeout
      });

      // Cache the result
      apiCache.set(cacheKey, response.data);

      res.json({
        data: response.data,
        source: 'doa_api',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('DOA API Error:', error);
      res.status(500).json({
        error: 'Failed to fetch production data',
        message: error.message,
        fallback: 'Using cached or demo data'
      });
    }
  });
}

/**
 * Fetch seasonal production targets
 * GET /api/doa/seasonal-targets
 * Query: ?zone=UpCountry&year=2025
 */
function setupSeasonalTargetsEndpoint(app) {
  app.get('/api/doa/seasonal-targets', async (req, res) => {
    try {
      const { zone, year } = req.query;

      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}/seasonal-targets`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          params: { zone, year },
          timeout: DOA_API_CONFIG.timeout
        }
      );

      res.json(response.data);

    } catch (error) {
      console.error('Error fetching seasonal targets:', error);
      res.status(500).json({ error: 'Failed to fetch seasonal targets' });
    }
  });
}

/**
 * Fetch crop-specific information
 * GET /api/doa/crops
 * Query: ?crop=Potato&district=Badulla&season=Maha
 */
function setupCropsEndpoint(app) {
  app.get('/api/doa/crops', async (req, res) => {
    try {
      const { crop, district, season } = req.query;

      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}/crops`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          params: { crop, district, season },
          timeout: DOA_API_CONFIG.timeout
        }
      );

      res.json(response.data);

    } catch (error) {
      console.error('Error fetching crop data:', error);
      res.status(500).json({ error: 'Failed to fetch crop data' });
    }
  });
}

/**
 * Fetch monthly production trends
 * GET /api/doa/monthly-trends
 * Query: ?district=Badulla&crop=Beans&year=2025
 */
function setupMonthlyTrendsEndpoint(app) {
  app.get('/api/doa/monthly-trends', async (req, res) => {
    try {
      const { district, crop, year } = req.query;

      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}/monthly-trends`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          params: { district, crop, year },
          timeout: DOA_API_CONFIG.timeout
        }
      );

      res.json(response.data);

    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      res.status(500).json({ error: 'Failed to fetch monthly trends' });
    }
  });
}

/**
 * Get all districts and their agro-climatic zones
 * GET /api/doa/districts
 */
function setupDistrictsEndpoint(app) {
  app.get('/api/doa/districts', async (req, res) => {
    try {
      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}/districts`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          timeout: DOA_API_CONFIG.timeout
        }
      );

      res.json(response.data);

    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ error: 'Failed to fetch district list' });
    }
  });
}

/**
 * Sync DOA data to local database
 * POST /api/admin/sync-doa-data
 * Requires: admin authentication
 */
function setupAdminSyncEndpoint(app, db) {
  app.post('/api/admin/sync-doa-data', async (req, res) => {
    try {
      // Verify admin token (implement your auth logic)
      if (!req.headers.authorization) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch all production data
      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}/production/all`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          timeout: DOA_API_CONFIG.timeout
        }
      );

      // Store in local database
      const { data } = response;
      
      for (const record of data) {
        db.run(
          `INSERT OR REPLACE INTO production_data 
           (district, crop, season, year, month, production_mt, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            record.district,
            record.crop,
            record.season,
            record.year,
            record.month,
            record.production_mt
          ]
        );
      }

      res.json({
        message: 'Data sync completed',
        recordsProcessed: data.length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Data sync error:', error);
      res.status(500).json({ 
        error: 'Failed to sync DOA data',
        message: error.message 
      });
    }
  });
}

// ============================================================================
// PART 3: Error Handling & Fallback Strategy
// ============================================================================

/**
 * Robust API caller with retry logic
 */
async function fetchFromDOAWithRetry(endpoint, params, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(
        `${DOA_API_CONFIG.baseUrl}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${DOA_API_CONFIG.authToken}`,
            'X-API-Key': DOA_API_CONFIG.apiKey
          },
          params,
          timeout: DOA_API_CONFIG.timeout
        }
      );

      console.log(`✓ DOA API success on attempt ${attempt}`);
      return response.data;

    } catch (error) {
      lastError = error;
      console.warn(`✗ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  console.error('All retry attempts failed:', lastError);
  throw lastError;
}

// ============================================================================
// PART 4: Database Schema for Storing DOA Data
// ============================================================================

/**
 * Initialize DOA data tables
 */
function initializeDOADatabase(db) {
  // Production data table
  db.run(`
    CREATE TABLE IF NOT EXISTS production_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      crop TEXT NOT NULL,
      season TEXT CHECK(season IN ('Maha', 'Yala', 'Inter-season')),
      year INTEGER NOT NULL,
      month INTEGER,
      production_mt REAL,
      target_mt REAL,
      actual_vs_target_percent REAL,
      data_source TEXT DEFAULT 'doa_cropix',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(district, crop, season, year, month)
    )
  `);

  // Agro-climatic zones table
  db.run(`
    CREATE TABLE IF NOT EXISTS agro_climatic_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL UNIQUE,
      zone TEXT CHECK(zone IN ('Up-Country', 'Mid-Country', 'Low-Country')),
      rainfall_zone TEXT CHECK(rainfall_zone IN ('Wet', 'Intermediate', 'Dry')),
      elevation_range TEXT,
      primary_vegetables TEXT,
      irrigation_available BOOLEAN,
      latitude REAL,
      longitude REAL
    )
  `);

  // Seasonal targets table
  db.run(`
    CREATE TABLE IF NOT EXISTS seasonal_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      crop TEXT NOT NULL,
      season TEXT NOT NULL,
      year INTEGER NOT NULL,
      target_production_mt REAL,
      achievability_percent REAL,
      notes TEXT,
      updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(district, crop, season, year)
    )
  `);

  console.log('✅ DOA database tables initialized');
}

// ============================================================================
// PART 5: Monitoring & Logging
// ============================================================================

const fs = require('fs');

function setupDOALogging(logFile = 'doa_api.log') {
  const log = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
    console.log(logEntry);
  };

  return log;
}

module.exports = { DOA_API_CONFIG, apiCache, setupDistrictProductionEndpoint, setupSeasonalTargetsEndpoint, setupCropsEndpoint, setupMonthlyTrendsEndpoint, setupDistrictsEndpoint, setupAdminSyncEndpoint, fetchFromDOAWithRetry, initializeDOADatabase, setupDOALogging };
