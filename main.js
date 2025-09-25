const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

const userData = app.getPath('userData');
const dbFile = path.join(userData, 'xavros.sqlite');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  // create DB folder if not exist
  try { fs.mkdirSync(userData, { recursive: true }); } catch(e){}

  // init SQLite
  const db = new sqlite3.Database(dbFile);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT, timestamp TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, role TEXT, content TEXT)`);
  });

  // create window
  createWindow();

  // tray (optional)
  tray = new Tray(path.join(__dirname, 'renderer', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Xavros', click: ()=> { mainWindow.show(); } },
    { label: 'Quit', click: ()=> { app.quit(); } }
  ]);
  tray.setToolTip('Xavros');
  tray.setContextMenu(contextMenu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers: select models folder, read config, simple chat save/read
ipcMain.handle('select-model-folder', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (res.canceled) return null;
  return res.filePaths[0];
});

ipcMain.handle('read-config', async () => {
  const cfgPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(cfgPath)) return {};
  return JSON.parse(fs.readFileSync(cfgPath,'utf8'));
});

ipcMain.handle('list-local-models', async () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8'));
  const modelDir = cfg.modelFolder || path.join(__dirname, 'models');
  try {
    const names = fs.readdirSync(modelDir).filter(f => fs.statSync(path.join(modelDir,f)).isDirectory());
    return names;
  } catch(e) {
    return [];
  }
});

ipcMain.handle('new-chat', async (event, model) => {
  const db = new sqlite3.Database(dbFile);
  const timestamp = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO chats (model,timestamp) VALUES (?,?)', [model||'mistral', timestamp], function(err){
      if (err) reject(err);
      else resolve({ chatId: this.lastID, model, timestamp });
    });
  });
});

ipcMain.handle('save-message', async (event, chatId, role, content) => {
  const db = new sqlite3.Database(dbFile);
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO messages (chat_id,role,content) VALUES (?,?,?)', [chatId, role, content], function(err){
      if(err) reject(err);
      else resolve({ id: this.lastID });
    });
  });
});

ipcMain.handle('get-messages', async (event, chatId) => {
  const db = new sqlite3.Database(dbFile);
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages WHERE chat_id = ? ORDER BY id ASC', [chatId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});
