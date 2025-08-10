const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Add this line

// Display startup banner with ASCII art and version
function displayStartupBanner() {
  const packageInfo = require('./package.json');
  console.log('\n');
  console.log('████████╗██╗   ██╗    ████████╗██╗███╗   ███╗███████╗');
  console.log('╚══██╔══╝██║   ██║    ╚══██╔══╝██║████╗ ████║██╔════╝');
  console.log('   ██║   ██║   ██║       ██║   ██║██╔████╔██║█████╗  ');
  console.log('   ██║   ╚██╗ ██╔╝       ██║   ██║██║╚██╔╝██║██╔══╝  ');
  console.log('   ██║    ╚████╔╝        ██║   ██║██║ ╚═╝ ██║███████╗');
  console.log('   ╚═╝     ╚═══╝         ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝');
  console.log('                    ████████╗██╗  ██╗                 ');
  console.log('                    ╚══██╔══╝╚██╗██╔╝                 ');
  console.log('                       ██║    ╚███╔╝                  ');
  console.log('                       ██║    ██╔██╗                  ');
  console.log('                       ██║   ██╔╝ ██╗                 ');
  console.log('                       ╚═╝   ╚═╝  ╚═╝                 ');
  console.log('');
  console.log('======================================');
  console.log(`Version: ${packageInfo.version}`);
  console.log('======================================\n');
}

// Show banner at startup
displayStartupBanner();

const app = express();
const PORT = process.env.PORT || 3000;

// Move to .env file
const hlsOutputDirectory = process.env.HLS_OUTPUT_DIRECTORY;
const fullHlsPlaylist = process.env.FULL_HLS_PLAYLIST;
const livePlaylistPath = process.env.LIVE_PLAYLIST_PATH;
const validTokens = process.env.VALID_TOKENS.split(',');
const windowSize = parseInt(process.env.WINDOW_SIZE, 10);
const segmentDuration = parseInt(process.env.SEGMENT_DURATION, 10);

let segments = [];

// Add a simple authentication middleware to the app. This gets a token from the query string and checks if it matches the expected token.
function checkToken(req, res, next){
  const token = req.query.token;
  console.log(token);
  if (validTokens.includes(token)) {
    console.log('Token is valid');
    next();
  } else {
    console.log('Token is invalid');
    res.status(401).send('Unauthorized');
  }
}

function logToken(req, res, next) {
  if (req.query.token) {
    console.log(`${Date()} Token:`, req.query.token);
  }
  next();
}


app.get('/', checkToken, function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use('/stream',logToken, express.static(hlsOutputDirectory));

app.listen(PORT, serverStartup);


function serverStartup(){
  console.log(`Server is running on port ${PORT}`);
  updateLivePlaylist();
}

function updateLivePlaylist() {
  let fullHlsSegments = fs.readFileSync(fullHlsPlaylist, 'utf-8');
  segments = fullHlsSegments.split('\n').filter(line => line.endsWith('.ts'));

  function writeLivePlaylist(startIndex) {
    fullHlsSegments = fs.readFileSync(fullHlsPlaylist, 'utf-8');
    segments = fullHlsSegments.split('\n').filter(line => line.endsWith('.ts'));
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

    fs.writeFileSync(livePlaylistPath, livePlaylist);
  }

  // Sliding window update loop
  let startIndex = 0;
  const interval = setInterval(() => {
    if (startIndex + windowSize > segments.length) {
      clearInterval(interval);
      console.log('End of stream.');
    } else {
      writeLivePlaylist(startIndex);
      startIndex++;
      console.log(`Updated live playlist at segment index: ${startIndex}`);
    }
  }, segmentDuration * 1000);
}

