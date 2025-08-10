# TV Time Transmitter Fast
TV Time Transmitter Fast is a Node.js Express application that serves HLS (HTTP Live Streaming) video content with token-based authentication. The application creates sliding-window HLS playlists from full playlists and serves video streams to authenticated users.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively
- Bootstrap and run the repository:
  - `npm install` -- takes 11 seconds to complete. Installs 70+ packages.
  - `npm audit` -- takes < 1 second. Check for security vulnerabilities (may be none if already fixed).
  - Copy `.env.example` to `.env` and configure environment variables (see Configuration section).
  - `node app.js` -- starts immediately (< 1 second). Server runs on configured PORT.
- No build step required - this is a simple Node.js application with no compilation.
- No test infrastructure exists - package.json test script is placeholder only.

## Configuration Requirements
- CRITICAL: Application requires `.env` file with these exact variables:
  - `PORT=3000` (optional, defaults to 3000)
  - `HLS_OUTPUT_DIRECTORY=./segments` (directory containing HLS .ts segment files)
  - `FULL_HLS_PLAYLIST=./segments/full.m3u8` (complete HLS playlist file)
  - `LIVE_PLAYLIST_PATH=./segments/index.m3u8` (generated sliding window playlist)
  - `VALID_TOKENS=token1,token2,token3` (comma-separated authentication tokens)
  - `WINDOW_SIZE=5` (number of segments in sliding window)
  - `SEGMENT_DURATION=6` (segment duration in seconds)
- Use `.env.example` as template for local development.
- Application will fail to start without proper `.env` configuration.

## Running the Application
- Development mode:
  - Ensure `.env` file exists with valid configuration.
  - `node app.js` -- starts server immediately
  - Server logs show: "Server is running on port [PORT]"
  - Sliding window updates logged every SEGMENT_DURATION seconds
- Production mode:
  - `./run-prod.sh` -- starts server on port 80 using nohup
  - `./kill-prod.sh` -- kills node and ffmpeg processes
  - Make scripts executable first: `chmod +x run-prod.sh kill-prod.sh`

## Validation
- Always manually validate changes by testing these complete scenarios:
  1. **Authentication Flow**: 
     - Valid token: `curl "http://localhost:3000?token=VALID_TOKEN"` returns 200 with HTML
     - Invalid token: `curl "http://localhost:3000?token=invalid"` returns 401 Unauthorized
  2. **HLS Streaming**:
     - Playlist access: `curl "http://localhost:3000/stream/index.m3u8?token=VALID_TOKEN"` returns m3u8 content
     - Verify sliding window contains WINDOW_SIZE segments with correct sequence numbers
  3. **Web Interface**:
     - Load `http://localhost:3000?token=VALID_TOKEN` in browser
     - Verify video player loads with HLS source
     - Check browser console for JavaScript errors
- ALWAYS run `npm audit` after modifying dependencies and `npm audit fix` if vulnerabilities are found.
- No linting tools configured - validate JavaScript syntax manually.

## Application Architecture
- **Main Components**:
  - `app.js` -- Express server with authentication middleware and HLS playlist management
  - `index.html` -- Simple HTML5 video player interface
  - `package.json` -- Dependencies: express, dotenv
- **Key Features**:
  - Token-based authentication via query parameters
  - Sliding window HLS playlist generation from full playlists  
  - Static file serving for HLS segments
  - Automatic playlist updates based on segment duration
- **Security**:
  - Authentication required for all endpoints
  - Valid tokens configured via VALID_TOKENS environment variable
  - Express vulnerabilities fixed via `npm audit fix`

## Common Tasks
The following are outputs from frequently run commands. Reference them instead of running bash commands to save time.

### Repository Structure
```
.
├── .env.example          # Environment variable template
├── .gitignore           # Standard Node.js gitignore
├── LICENSE              # MIT License
├── app.js               # Main Express application
├── index.html           # Video player interface
├── kill-prod.sh         # Production stop script
├── package.json         # Node.js dependencies
├── package-lock.json    # Dependency lock file
└── run-prod.sh          # Production start script
```

### package.json Dependencies
```json
{
  "dependencies": {
    "dotenv": "^16.4.7",
    "express": "^4.21.1"
  }
}
```

### Environment Variables Template (.env.example)
```
PORT=3000
HLS_OUTPUT_DIRECTORY=./test_segments
FULL_HLS_PLAYLIST=./test_segments/full_playlist.m3u8
LIVE_PLAYLIST_PATH=./test_segments/index.m3u8
VALID_TOKENS=test123,abc456
WINDOW_SIZE=5
SEGMENT_DURATION=6
```

## Critical Warnings
- NEVER run the application without a properly configured `.env` file - it will crash immediately.
- ALWAYS verify HLS directory structure exists before starting the application.
- ALWAYS run `npm audit fix` after `npm install` to address security vulnerabilities.
- Authentication tokens are sensitive - never commit actual production tokens to repository.
- Application expects existing HLS segment files and full playlist - it does not generate video content.