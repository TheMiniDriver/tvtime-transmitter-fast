const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Move to .env file
const hlsOutputDirectory = './segments';
const fullHlsPlaylist = './segments/fullIndex.m3u8';
const livePlaylistPath = './segments/index.m3u8'; 
const validTokens = ['elphin', 'elphintvapp', 'bradley','ipad'];

const windowSize = 10; // Number of segments to keep in the live playlist
const segmentDuration = 6; // Duration of each segment in seconds. This must match the segment length that you have pre-generated
let segments = [];
let mediaSequence = 0;

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
  const fullHlsSegments = fs.readFileSync(fullHlsPlaylist, 'utf-8');
  segments = fullHlsSegments.split('\n').filter(line => line.endsWith('.ts'));

  function writeLivePlaylist(startIndex) {
    let livePlaylist = '#EXTM3U\n';
    livePlaylist += '#EXT-X-VERSION:3\n';
    livePlaylist += `#EXT-X-TARGETDURATION:${segmentDuration}\n`;
    livePlaylist += `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n`;

    for (let i = 0; i < endIndex; i++) {
      if (startIndex + i < segments.length) {
        livePlaylist += `#EXTINF:${segmentDuration},\n`;
        livePlaylist += `${segments[startIndex + i]}\n`;
      }
    }

    fs.writeFileSync(livePlaylistPath, livePlaylist);
    //mediaSequence++;
  }

  // Sliding window update loop
  let startIndex = 0;
  let endIndex = windowSize; 
  const interval = setInterval(() => {
    if (startIndex + windowSize > segments.length) {
      clearInterval(interval);
      console.log('End of stream.');
    } else {
      writeLivePlaylist(startIndex);
      //startIndex++;
      endIndex ++; 
      console.log(`Updated live playlist at segment index: ${startIndex}`);
    }
  }, segmentDuration * 1000);
}

