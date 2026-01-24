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

module.exports = { DOA_API_CONFIG, apiCache, setupDistrictProductionEndpoint, setupSeasonalTargetsEndpoint };
