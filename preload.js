const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xavrosAPI', {
  selectModelFolder: () => ipcRenderer.invoke('select-model-folder'),
  readConfig: () => ipcRenderer.invoke('read-config'),
  listLocalModels: () => ipcRenderer.invoke('list-local-models'),
  newChat: (model) => ipcRenderer.invoke('new-chat', model),
  saveMessage: (chatId, role, content) => ipcRenderer.invoke('save-message', chatId, role, content),
  getMessages: (chatId) => ipcRenderer.invoke('get-messages', chatId)
});
