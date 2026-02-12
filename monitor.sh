#!/bin/bash

# Configuration
PORT=${PORT:-3000}
URL="http://localhost:${PORT}/"

echo "Starting continuous monitoring of school list changes..."
echo "Making requests to: $URL"
echo "Interval: 5 seconds"
echo "Press Ctrl+C to stop"
echo

while true; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Making request..."

    # Make request and capture response
    response=$(curl -s -w "HTTP %{http_code}" "$URL" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "$response"
    else
        echo "Request failed - is the server running on port $PORT?"
    fi

    echo "Waiting 5 seconds..."
    echo
    sleep 5
done