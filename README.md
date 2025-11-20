<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1FO-7V035hjf8MKwpMTKITJZSmPfbrCPp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Install server dependencies (if not already done):
   `npm install express socket.io socket.io-client cors`
3. Start the Multiplayer Server (Terminal 1):
   `node server/server.js`
4. Start the Game Client (Terminal 2):
   `npm run dev`

> **Note:** You need Node.js v16 or higher. If you see errors, check your node version with `node -v`.
