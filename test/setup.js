// Test setup file
const fs = require('fs');
const path = require('path');

// Create test segments directory and files for testing
const testSegmentsDir = path.join(__dirname, '..', 'test_segments');
const testPlaylistPath = path.join(testSegmentsDir, 'full_playlist.m3u8');
const testIndexPath = path.join(testSegmentsDir, 'index.m3u8');

beforeAll(() => {
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testSegmentsDir)) {
    fs.mkdirSync(testSegmentsDir, { recursive: true });
  }

  // Create a test full playlist
  const testPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
segment000.ts
#EXTINF:6.0,
segment001.ts
#EXTINF:6.0,
segment002.ts
#EXTINF:6.0,
segment003.ts
#EXTINF:6.0,
segment004.ts
#EXTINF:6.0,
segment005.ts
#EXTINF:6.0,
segment006.ts
#EXTINF:6.0,
segment007.ts
#EXTINF:6.0,
segment008.ts
#EXTINF:6.0,
segment009.ts
#EXT-X-ENDLIST
`;

  fs.writeFileSync(testPlaylistPath, testPlaylist);

  // Create some dummy segment files
  for (let i = 0; i < 10; i++) {
    const segmentPath = path.join(testSegmentsDir, `segment${i.toString().padStart(3, '0')}.ts`);
    fs.writeFileSync(segmentPath, `dummy segment ${i} content`);
  }
});

afterAll(() => {
  // Clean up test files
  if (fs.existsSync(testSegmentsDir)) {
    const files = fs.readdirSync(testSegmentsDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(testSegmentsDir, file));
    });
    fs.rmdirSync(testSegmentsDir);
  }
});