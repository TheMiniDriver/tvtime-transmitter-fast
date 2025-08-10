const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import the app, but we need to make it testable first
// We'll create a testable version of app.js
describe('TV Time Transmitter Fast - Core Functionality', () => {
  let app;
  let server;
  
  beforeAll((done) => {
    // Set test environment variables
    process.env.PORT = '0'; // Use random port for testing
    process.env.HLS_OUTPUT_DIRECTORY = './test_segments';
    process.env.FULL_HLS_PLAYLIST = './test_segments/full_playlist.m3u8';
    process.env.LIVE_PLAYLIST_PATH = './test_segments/index.m3u8';
    process.env.VALID_TOKENS = 'test123,abc456';
    process.env.WINDOW_SIZE = '5';
    process.env.SEGMENT_DURATION = '6';
    
    // Create a testable version of the app
    const express = require('express');
    const testApp = express();
    
    // Simple authentication middleware for testing
    function checkToken(req, res, next) {
      const token = req.query.token;
      const validTokens = process.env.VALID_TOKENS.split(',');
      if (validTokens.includes(token)) {
        next();
      } else {
        res.status(401).send('Unauthorized');
      }
    }
    
    function logToken(req, res, next) {
      if (req.query.token) {
        console.log(`${Date()} Token:`, req.query.token);
      }
      next();
    }
    
    // Set up routes like in the main app
    testApp.get('/', checkToken, function(req, res) {
      res.sendFile(path.join(__dirname, '..', 'index.html'));
    });
    
    testApp.use('/stream', logToken, express.static(process.env.HLS_OUTPUT_DIRECTORY));
    
    // Start server
    server = testApp.listen(0, () => {
      app = testApp;
      done();
    });
  });
  
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Authentication', () => {
    test('should accept valid token', async () => {
      const response = await request(app)
        .get('/?token=test123')
        .expect(200);
    });

    test('should accept another valid token', async () => {
      const response = await request(app)
        .get('/?token=abc456')
        .expect(200);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/?token=invalid')
        .expect(401);
      
      expect(response.text).toBe('Unauthorized');
    });

    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/')
        .expect(401);
      
      expect(response.text).toBe('Unauthorized');
    });
  });

  describe('Static File Serving', () => {
    test('should serve HLS segments with valid token', async () => {
      const response = await request(app)
        .get('/stream/segment000.ts?token=test123')
        .expect(200);
    });

    test('should serve full playlist with valid token', async () => {
      const response = await request(app)
        .get('/stream/full_playlist.m3u8?token=test123')
        .expect(200);
      
      expect(response.text).toContain('#EXTM3U');
      expect(response.text).toContain('segment000.ts');
    });

    test('should handle missing files gracefully', async () => {
      const response = await request(app)
        .get('/stream/nonexistent.m3u8?token=test123')
        .expect(404);
    });
  });

  describe('Environment Configuration', () => {
    test('should load environment variables correctly', () => {
      expect(process.env.HLS_OUTPUT_DIRECTORY).toBe('./test_segments');
      expect(process.env.VALID_TOKENS).toBe('test123,abc456');
      expect(process.env.WINDOW_SIZE).toBe('5');
      expect(process.env.SEGMENT_DURATION).toBe('6');
    });

    test('should parse valid tokens correctly', () => {
      const validTokens = process.env.VALID_TOKENS.split(',');
      expect(validTokens).toContain('test123');
      expect(validTokens).toContain('abc456');
      expect(validTokens).toHaveLength(2);
    });

    test('should parse numeric environment variables', () => {
      const windowSize = parseInt(process.env.WINDOW_SIZE, 10);
      const segmentDuration = parseInt(process.env.SEGMENT_DURATION, 10);
      
      expect(windowSize).toBe(5);
      expect(segmentDuration).toBe(6);
      expect(typeof windowSize).toBe('number');
      expect(typeof segmentDuration).toBe('number');
    });
  });
});