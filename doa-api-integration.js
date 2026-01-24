/**
 * DOA CROPIX API Integration
 * VegWaste Sri Lanka - Agricultural Data Integration
 */

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

module.exports = { DOA_API_CONFIG };
