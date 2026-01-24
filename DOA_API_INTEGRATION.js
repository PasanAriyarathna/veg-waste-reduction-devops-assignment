/**
 * DOA CROPIX API Integration Guide
 * VegWaste Sri Lanka - Agricultural Data Integration
 * 
 * This guide provides the technical implementation for integrating
 * Department of Agriculture (DOA) CROPIX API with the VegWaste platform.
 */

// ============================================================================
// PART 1: Environment Setup & Configuration
// ============================================================================

/*
1. Register with DOA CROPIX:
   - Visit: https://cropix.doa.gov.lk/ (or current DOA portal)
   - Apply for API access
   - Request authentication token
   - Document base URL and API endpoints
   - Note: Some endpoints may have rate limiting
   
2. Add to .env file:
*/

// .env configuration
const DOA_API_CONFIG = {
  baseUrl: 'https://api.doa.gov.lk/v1', // Example - confirm with DOA
  apiKey: process.env.DOA_API_KEY,
  authToken: process.env.DOA_AUTH_TOKEN,
  timeout: 10000,
  retryAttempts: 3,
  cacheDuration: 3600 // 1 hour
};

// ============================================================================
// PART 2: Backend Server.js Integration
// ============================================================================

// Add this to your server.js:

const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache for API responses
const apiCache = new NodeCache({ stdTTL: 3600 });

/**
 * Fetch district-wise production data from DOA CROPIX
 * POST /api/doa/district-production
 * Body: { district, season, year }
 */
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

/**
 * Fetch seasonal production targets
 * GET /api/doa/seasonal-targets
 * Query: ?zone=UpCountry&year=2025
 */
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

/**
 * Fetch crop-specific information
 * GET /api/doa/crops
 * Query: ?crop=Potato&district=Badulla&season=Maha
 */
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

/**
 * Fetch monthly production trends
 * GET /api/doa/monthly-trends
 * Query: ?district=Badulla&crop=Beans&year=2025
 */
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

/**
 * Get all districts and their agro-climatic zones
 * GET /api/doa/districts
 */
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

/**
 * Sync DOA data to local database
 * POST /api/admin/sync-doa-data
 * Requires: admin authentication
 */
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
// PART 4: Frontend Integration
// ============================================================================

// In your district-tracking.html or other frontend pages:

/*
// Fetch real production data from backend
async function fetchDistrictProduction(district, season, year) {
  try {
    const response = await fetch('/api/doa/district-production', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        district: district,
        season: season,
        year: year
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Production data source:', result.source); // 'cache' or 'doa_api'
    
    return result.data;

  } catch (error) {
    console.error('Failed to fetch production data:', error);
    // Show demo data as fallback
    return getDemoProductionData(district, season);
  }
}

// Fetch seasonal targets
async function fetchSeasonalTargets(zone, year) {
  try {
    const response = await fetch(
      `/api/doa/seasonal-targets?zone=${zone}&year=${year}`
    );
    
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch seasonal targets:', error);
    return null;
  }
}

// Display monthly production trends
async function displayMonthlyTrends(district, crop, year) {
  try {
    const response = await fetch(
      `/api/doa/monthly-trends?district=${district}&crop=${crop}&year=${year}`
    );
    
    const data = await response.json();
    
    // Create chart with data
    const monthlyData = data.map(d => ({
      month: d.month,
      production: d.production_mt
    }));
    
    updateProductionChart(monthlyData);

  } catch (error) {
    console.error('Error displaying trends:', error);
  }
}
*/

// ============================================================================
// PART 5: Database Schema for Storing DOA Data
// ============================================================================

/*
-- Create production_data table to store DOA CROPIX data locally

CREATE TABLE production_data (
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
);

-- Create agro_climatic_zones table
CREATE TABLE agro_climatic_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  district TEXT NOT NULL UNIQUE,
  zone TEXT CHECK(zone IN ('Up-Country', 'Mid-Country', 'Low-Country')),
  rainfall_zone TEXT CHECK(rainfall_zone IN ('Wet', 'Intermediate', 'Dry')),
  elevation_range TEXT,
  primary_vegetables TEXT,
  irrigation_available BOOLEAN,
  latitude REAL,
  longitude REAL
);

-- Create seasonal_targets table
CREATE TABLE seasonal_targets (
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
);
*/

// ============================================================================
// PART 6: Sample DOA API Response Formats
// ============================================================================

/*
Expected API Response Format from DOA CROPIX:

1. Production Data Response:
{
  "district": "Badulla",
  "crop": "Beans (Green)",
  "season": "Maha",
  "year": 2025,
  "month": 1,
  "production_mt": 320,
  "target_mt": 300,
  "actual_vs_target_percent": 106.7,
  "unit": "Metric Tonnes",
  "data_quality": "verified",
  "last_updated": "2025-01-15T10:30:00Z"
}

2. Seasonal Targets Response:
[
  {
    "district": "Nuwara Eliya",
    "crop": "Potato",
    "season": "Maha",
    "year": 2025,
    "target_production_mt": 285,
    "achievability_percent": 98.5,
    "irrigation_requirement": "Minimal",
    "rainfall_expected_mm": 1200
  }
]

3. Monthly Trends Response:
[
  {"month": "September", "month_num": 9, "production_mt": 45.2},
  {"month": "October", "month_num": 10, "production_mt": 85.3},
  {"month": "November", "month_num": 11, "production_mt": 120.5},
  ...
]

4. Districts Response:
[
  {
    "district": "Badulla",
    "zone": "Up-Country",
    "rainfall_zone": "Intermediate",
    "elevation_m": 680,
    "primary_vegetables": ["Beans", "Carrot", "Potato", "Onion", "Tomato"],
    "coordinates": {"latitude": 6.9881, "longitude": 81.2680},
    "irrigation_available": true
  }
]
*/

// ============================================================================
// PART 7: Monitoring & Logging
// ============================================================================

/*
// Add logging for API calls
const fs = require('fs');
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level}: ${message}\n`;
  fs.appendFileSync('doa_api.log', logEntry);
  console.log(logEntry);
};

// Usage:
log('DOA API sync started');
log('Fetching production data for Badulla district');
log('Cache hit for production_Badulla_maha_2025');
log('API rate limit approaching: 95/100 calls used', 'WARN');
log('Failed to connect to DOA API server', 'ERROR');
*/

// ============================================================================
// PART 8: Data Synchronization Strategy
// ============================================================================

/*
Schedule automated daily sync with DOA CROPIX:

Using node-cron:
const cron = require('node-cron');

// Run sync every morning at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Scheduled DOA data sync started...');
    const response = await fetchFromDOAWithRetry('/production/all', {
      year: new Date().getFullYear()
    });
    
    // Store in database
    storeProductionDataLocally(response);
    console.log('Sync completed successfully');
    
  } catch (error) {
    console.error('Scheduled sync failed:', error);
  }
});

// Run sync every Monday for weekly seasonal targets
cron.schedule('0 6 * * 1', async () => {
  try {
    const targets = await fetchFromDOAWithRetry('/seasonal-targets', {
      year: new Date().getFullYear()
    });
    storeSeasonalTargets(targets);
  } catch (error) {
    console.error('Weekly seasonal targets sync failed:', error);
  }
});
*/

// ============================================================================
// PART 9: Implementation Checklist
// ============================================================================

/*
DO BEFORE GOING TO PRODUCTION:

☐ Register account with DOA CROPIX
☐ Request and document API credentials
☐ Test API endpoints in staging environment
☐ Implement error handling and retry logic
☐ Create database tables for production data
☐ Set up daily/weekly synchronization schedule
☐ Configure logging and monitoring
☐ Implement caching strategy (1-hour TTL recommended)
☐ Update frontend pages to display real data
☐ Set up alerts for API failures
☐ Document API integration for team
☐ Perform load testing
☐ Set up redundancy/failover to demo data
☐ Train staff on data interpretation
☐ Schedule regular maintenance and updates
*/

module.exports = {
  DOA_API_CONFIG,
  fetchFromDOAWithRetry
};
