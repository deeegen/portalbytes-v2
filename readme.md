# Portalbytes V2

## Overview
Portalbytes V2 is a Node.js proxy application that lets you switch between two backend modes—**corrosion** and **alloy**—on the fly.  
Live demo: https://portalbytes.onrender.com/

## Requirements
- Node.js (v14+ recommended)  
- Hosting platform with Node.js backend support

## Deployment

1. **Fork** this repository.  
2. **Configure** the backend mode:
   - Open the main server file (e.g. `server.js`).
   - Set the `backend` variable to either `corrosion` or `alloy`.  
3. **Upload** the code to your Node.js–compatible hosting provider.  
4. **Install** dependencies:
   ```npm install```
5. **Start** the server:
   ```npm start```
6. **Enjoy!!!**

## Configuration
The backend selection is managed by a single variable in the server entry point.

Future plans include exposing this toggle through a web-based control panel.

## Changelog

### August 10, 2025
- Added front end config to switch between backends! (Might not be as good on render URL, just refresh after you change your setting)

### August 5, 2025
- Added server-side configuration to switch between `corrosion` and `alloy` backends (work in progress).

### August 1–4, 2025
- Replaced history state handling in `proxy.html`.
- Introduced a 2D game-styled chatroom with custom image support.

## Known Issues
- **Iframe mask looping**: The multi-backend proxy implementation causes the iframe mask page to reload continuously. A temporary fallback will be provided soon.

## Roadmap
- Frontend/client logic for dynamic proxy backend switching.
- Additional features and UI enhancements.

## Releases
- **v2.9.9** ([GitHub release](https://github.com/deeegen/portalbytes-v2/releases/tag/v2.9.9))
  - Nearing v3 milestone; includes proxy-backend configuration options.
  - Note: iframe mode is currently broken.
