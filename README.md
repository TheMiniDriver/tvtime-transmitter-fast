# TV Time Transmitter Fast

TV Time Transmitter Fast is a Node.js Express application that serves HLS (HTTP Live Streaming) video content with token-based authentication. The application creates sliding-window HLS playlists from full playlists and serves video streams to authenticated users.

## Features

- Token-based authentication for secure access
- HLS video streaming with sliding window playlists
- Automatic playlist updates based on segment duration
- Static file serving for video segments
- Configurable through environment variables

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tvtime-transmitter-fast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your specific configuration
   ```

## Configuration

The application requires a `.env` file with the following variables:

```env
PORT=3000
HLS_OUTPUT_DIRECTORY=./test_segments
FULL_HLS_PLAYLIST=./test_segments/full_playlist.m3u8
LIVE_PLAYLIST_PATH=./test_segments/index.m3u8
VALID_TOKENS=test123,abc456
WINDOW_SIZE=5
SEGMENT_DURATION=6
```

### Configuration Variables

- `PORT`: Server port (default: 3000)
- `HLS_OUTPUT_DIRECTORY`: Directory containing HLS segment files
- `FULL_HLS_PLAYLIST`: Path to complete HLS playlist file
- `LIVE_PLAYLIST_PATH`: Path for generated sliding window playlist
- `VALID_TOKENS`: Comma-separated list of authentication tokens
- `WINDOW_SIZE`: Number of segments in sliding window
- `SEGMENT_DURATION`: Segment duration in seconds

## Usage

### Development Mode

```bash
node app.js
```

### Production Mode

```bash
./run-prod.sh    # Start server on port 80
./kill-prod.sh   # Stop server
```

Make scripts executable first:
```bash
chmod +x run-prod.sh kill-prod.sh
```

## Authentication

Access the application by providing a valid token as a query parameter:

```
http://localhost:3000?token=test123
```

## API Endpoints

- `GET /?token=<token>` - Main video player interface
- `GET /stream/<file>?token=<token>` - HLS segments and playlists

## Testing

The project includes a comprehensive test suite using Jest.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- `test/app.test.js` - Core application functionality tests
- `test/playlist.test.js` - HLS playlist generation and manipulation tests
- `test/setup.js` - Test environment setup and cleanup

### Test Categories

- **Authentication Tests**: Validate token-based security
- **Static File Serving**: Test HLS segment and playlist serving
- **Environment Configuration**: Verify configuration loading
- **Playlist Generation**: Test sliding window playlist creation
- **Error Handling**: Validate graceful error responses

## Continuous Integration

The project uses GitHub Actions for automated testing on:
- Node.js versions: 18.x, 20.x, 22.x
- Security auditing
- Code coverage reporting

Tests run automatically on:
- Push to main/master branches
- Pull request creation/updates

## Development

### Prerequisites

- Node.js (18.x or higher)
- npm or yarn package manager

### Code Quality

The project follows standard Node.js practices:

- Environment-based configuration
- Express.js web framework
- Jest testing framework
- Security-first authentication approach

### Security

- All endpoints require valid token authentication
- Tokens are configured via environment variables
- No sensitive data in source code
- Regular security audits via `npm audit`

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Server won't start**: Ensure `.env` file exists with valid configuration
2. **Authentication fails**: Verify tokens in `VALID_TOKENS` environment variable
3. **Video won't play**: Check HLS directory structure and file permissions
4. **Tests fail**: Run `npm install` and ensure test dependencies are installed