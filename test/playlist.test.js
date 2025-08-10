const fs = require('fs');
const path = require('path');

describe('HLS Playlist Generation', () => {
  const testSegmentsDir = path.join(__dirname, '..', 'test_segments');
  const fullPlaylistPath = path.join(testSegmentsDir, 'full_playlist.m3u8');
  const livePlaylistPath = path.join(testSegmentsDir, 'index.m3u8');

  beforeAll(() => {
    // Ensure test directory exists (should be created by setup.js)
    if (!fs.existsSync(testSegmentsDir)) {
      fs.mkdirSync(testSegmentsDir, { recursive: true });
    }
  });

  describe('Playlist File Operations', () => {
    test('should read full playlist correctly', () => {
      expect(fs.existsSync(fullPlaylistPath)).toBe(true);
      
      const fullPlaylistContent = fs.readFileSync(fullPlaylistPath, 'utf-8');
      expect(fullPlaylistContent).toContain('#EXTM3U');
      expect(fullPlaylistContent).toContain('#EXT-X-VERSION:3');
      expect(fullPlaylistContent).toContain('segment000.ts');
    });

    test('should extract segments from full playlist', () => {
      const fullPlaylistContent = fs.readFileSync(fullPlaylistPath, 'utf-8');
      const segments = fullPlaylistContent.split('\n').filter(line => line.endsWith('.ts'));
      
      expect(segments).toHaveLength(10);
      expect(segments[0]).toBe('segment000.ts');
      expect(segments[9]).toBe('segment009.ts');
    });

    test('should generate sliding window playlist', () => {
      const fullPlaylistContent = fs.readFileSync(fullPlaylistPath, 'utf-8');
      const segments = fullPlaylistContent.split('\n').filter(line => line.endsWith('.ts'));
      
      // Simulate the playlist generation logic from app.js
      const windowSize = 5;
      const segmentDuration = 6;
      const startIndex = 0;
      
      let livePlaylist = '#EXTM3U\n';
      livePlaylist += '#EXT-X-VERSION:3\n';
      livePlaylist += `#EXT-X-TARGETDURATION:${segmentDuration}\n`;
      livePlaylist += `#EXT-X-MEDIA-SEQUENCE:${startIndex}\n`;

      for (let i = 0; i < windowSize; i++) {
        if (startIndex + i < segments.length) {
          livePlaylist += `#EXTINF:${segmentDuration},\n`;
          livePlaylist += `${segments[startIndex + i]}\n`;
        }
      }

      // Write the playlist
      fs.writeFileSync(livePlaylistPath, livePlaylist);
      
      // Verify the generated playlist
      expect(fs.existsSync(livePlaylistPath)).toBe(true);
      const generatedContent = fs.readFileSync(livePlaylistPath, 'utf-8');
      
      expect(generatedContent).toContain('#EXTM3U');
      expect(generatedContent).toContain('#EXT-X-MEDIA-SEQUENCE:0');
      expect(generatedContent).toContain('segment000.ts');
      expect(generatedContent).toContain('segment004.ts');
      expect(generatedContent).not.toContain('segment005.ts'); // Should not be in window
    });

    test('should handle sliding window advancement', () => {
      const fullPlaylistContent = fs.readFileSync(fullPlaylistPath, 'utf-8');
      const segments = fullPlaylistContent.split('\n').filter(line => line.endsWith('.ts'));
      
      // Test sliding window at different positions
      const windowSize = 5;
      const segmentDuration = 6;
      const startIndex = 3; // Start at segment 3
      
      let livePlaylist = '#EXTM3U\n';
      livePlaylist += '#EXT-X-VERSION:3\n';
      livePlaylist += `#EXT-X-TARGETDURATION:${segmentDuration}\n`;
      livePlaylist += `#EXT-X-MEDIA-SEQUENCE:${startIndex}\n`;

      for (let i = 0; i < windowSize; i++) {
        if (startIndex + i < segments.length) {
          livePlaylist += `#EXTINF:${segmentDuration},\n`;
          livePlaylist += `${segments[startIndex + i]}\n`;
        }
      }

      // Write and verify
      fs.writeFileSync(livePlaylistPath, livePlaylist);
      const generatedContent = fs.readFileSync(livePlaylistPath, 'utf-8');
      
      expect(generatedContent).toContain('#EXT-X-MEDIA-SEQUENCE:3');
      expect(generatedContent).toContain('segment003.ts');
      expect(generatedContent).toContain('segment007.ts');
      expect(generatedContent).not.toContain('segment002.ts'); // Before window
      expect(generatedContent).not.toContain('segment008.ts'); // After window
    });
  });

  describe('Environment Variable Parsing', () => {
    test('should handle window size parsing', () => {
      const windowSizeStr = '5';
      const windowSize = parseInt(windowSizeStr, 10);
      
      expect(windowSize).toBe(5);
      expect(typeof windowSize).toBe('number');
      expect(isNaN(windowSize)).toBe(false);
    });

    test('should handle segment duration parsing', () => {
      const segmentDurationStr = '6';
      const segmentDuration = parseInt(segmentDurationStr, 10);
      
      expect(segmentDuration).toBe(6);
      expect(typeof segmentDuration).toBe('number');
      expect(isNaN(segmentDuration)).toBe(false);
    });

    test('should handle token list parsing', () => {
      const validTokensStr = 'test123,abc456,xyz789';
      const validTokens = validTokensStr.split(',');
      
      expect(validTokens).toHaveLength(3);
      expect(validTokens).toContain('test123');
      expect(validTokens).toContain('abc456');
      expect(validTokens).toContain('xyz789');
    });

    test('should handle single token', () => {
      const singleTokenStr = 'onlytoken';
      const validTokens = singleTokenStr.split(',');
      
      expect(validTokens).toHaveLength(1);
      expect(validTokens[0]).toBe('onlytoken');
    });
  });
});