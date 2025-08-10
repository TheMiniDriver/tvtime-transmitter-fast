#!/bin/bash

echo "Stopping TV Time Transmitter..."

# Find and kill the specific transmitter process (node app.js)
TRANSMITTER_PIDS=$(pgrep -f "node app.js")

if [ -n "$TRANSMITTER_PIDS" ]; then
    echo "Found transmitter process(es): $TRANSMITTER_PIDS"
    echo "Terminating transmitter process(es)..."
    kill $TRANSMITTER_PIDS
    
    # Wait a moment and check if processes are still running
    sleep 2
    REMAINING_PIDS=$(pgrep -f "node app.js")
    if [ -n "$REMAINING_PIDS" ]; then
        echo "Some processes still running, force killing: $REMAINING_PIDS"
        kill -9 $REMAINING_PIDS
    fi
    
    echo "Transmitter process(es) stopped."
else
    echo "No transmitter processes found."
fi

# Keep ffmpeg termination for related streaming processes
FFMPEG_PIDS=$(pgrep ffmpeg)
if [ -n "$FFMPEG_PIDS" ]; then
    echo "Found ffmpeg process(es): $FFMPEG_PIDS"
    echo "Terminating ffmpeg process(es)..."
    pkill ffmpeg
    echo "ffmpeg process(es) stopped."
else
    echo "No ffmpeg processes found."
fi

echo "TV Time Transmitter shutdown complete."