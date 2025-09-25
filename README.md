# Xavros Desktop - Installer-ready Project

## What this is
This repository contains a ready-to-build Electron desktop app for **Xavros** — an offline/online AI assistant.
- Local models are read from the `models/` folder (subfolders per model).
- Chats are stored in a SQLite database located in the user's app data.
- Online mode will be available via the `Go Online` button (you must configure web API keys in `README`).

## Build a Windows Installer locally (one-time)
1. Install Node.js (LTS) and Git.
2. Open PowerShell in this folder.
3. Run:
   ```bash
   npm install
   npm run dist
   ```
4. After build completes, `dist/` will contain the installer `Xavros Setup.exe`.

## Build via GitHub Actions (recommended if you don't want to install build tools)
1. Create a new GitHub repository and push this code.
2. The included workflow `.github/workflows/build-windows.yml` will build Windows installer on push.
3. Download the generated installer from the Actions/Release artifacts.

## Using the app
1. Extract installer and run `Xavros.exe`.
2. Choose `Choose Models Folder` to point to a folder containing model subfolders.
3. Start a new chat and ask questions. Offline placeholder responses are shown until you connect a local model engine (e.g., Ollama or other local runner).

## Notes
- This package is build-ready but the actual model runtime integration (calling a model binary or server) is left as an integration point — you can wire Ollama, llama.cpp-based servers, or any local engine to the message flow in `main.js` or via a native module.
