/**
 * UNLOAD — minimal Electron shell.
 *
 * Two windows, nothing else:
 *
 *   1. the normal UNLOAD app, in an ordinary resizable window
 *   2. a tiny frameless transparent window holding Mochi, floating above
 *      other applications
 *
 * The web app is completely unaware of this file. It runs identically in a
 * plain browser; the desktop pet is an extra surface, not a replacement.
 *
 * Nothing here reads the screen, the keyboard, or any other application.
 * It positions a small window and relays two messages.
 */
const { app, BrowserWindow, ipcMain, screen, shell } = require('electron')
const path = require('node:path')

/** Where the app is served from. The dev server by default. */
const APP_URL = process.env.UNLOAD_URL || 'http://localhost:5273'

/** Mochi's resting window size — just big enough for the character. */
const PET_IDLE = { width: 118, height: 118 }
/** Grown to fit the speech bubble when Mochi has something to say. */
const PET_TALKING = { width: 300, height: 232 }

let mainWindow = null
let petWindow = null
let dragOrigin = null
/** Set when we close the pet ourselves, so quitting doesn't fight us. */
let quitting = false

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 880,
    minHeight: 620,
    title: 'UNLOAD',
    backgroundColor: '#FAF5EE',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(APP_URL)

  // Links to the outside world open in the real browser, not in the shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Requirement: closing UNLOAD closes Mochi too.
  mainWindow.on('closed', () => {
    mainWindow = null
    quitting = true
    if (petWindow && !petWindow.isDestroyed()) petWindow.destroy()
    petWindow = null
    app.quit()
  })
}

function createPetWindow() {
  const { workArea } = screen.getPrimaryDisplay()

  petWindow = new BrowserWindow({
    ...PET_IDLE,
    x: workArea.x + workArea.width - PET_IDLE.width - 48,
    y: workArea.y + workArea.height - PET_IDLE.height - 72,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    // `floating` sits above ordinary windows without hijacking focus or
    // covering system UI — a pet, not a takeover.
    alwaysOnTop: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  petWindow.setAlwaysOnTop(true, 'floating')
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
  petWindow.loadURL(`${APP_URL}/pet.html`)

  petWindow.once('ready-to-show', () => petWindow.show())

  petWindow.on('closed', () => {
    petWindow = null
    if (!quitting && mainWindow && !mainWindow.isDestroyed()) mainWindow.close()
  })
}

/**
 * Resize around the bottom-right corner, so Mochi stays put on screen while
 * the bubble grows upward and leftward out of it.
 */
function resizePet(size) {
  if (!petWindow || petWindow.isDestroyed()) return
  const b = petWindow.getBounds()
  const right = b.x + b.width
  const bottom = b.y + b.height
  petWindow.setBounds({
    x: Math.round(right - size.width),
    y: Math.round(bottom - size.height),
    width: size.width,
    height: size.height,
  })
}

/* ------------------------------------------------------------------ */
/* IPC — deliberately tiny                                             */
/* ------------------------------------------------------------------ */

ipcMain.on('pet:talking', (_e, talking) => {
  resizePet(talking ? PET_TALKING : PET_IDLE)
})

ipcMain.on('pet:visible', (_e, visible) => {
  if (!petWindow || petWindow.isDestroyed()) return
  if (visible) petWindow.showInactive()
  else petWindow.hide()
})

ipcMain.on('pet:drag-start', () => {
  if (petWindow && !petWindow.isDestroyed()) dragOrigin = petWindow.getBounds()
})

ipcMain.on('pet:drag-move', (_e, { dx, dy }) => {
  if (!petWindow || petWindow.isDestroyed() || !dragOrigin) return
  petWindow.setPosition(Math.round(dragOrigin.x + dx), Math.round(dragOrigin.y + dy))
})

ipcMain.on('pet:drag-end', () => {
  dragOrigin = null
})

/** Clicking Mochi brings the real app forward. */
ipcMain.on('main:focus', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
})

/* ------------------------------------------------------------------ */

app.whenReady().then(() => {
  createMainWindow()
  createPetWindow()


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
      createPetWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Including macOS: this is a desk tool, not something to leave resident.
  app.quit()
})

app.on('before-quit', () => {
  quitting = true
})
