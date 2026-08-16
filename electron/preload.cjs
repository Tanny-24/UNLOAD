/**
 * The entire bridge between the renderer and the desktop shell.
 *
 * Context isolation is on and Node is off in the renderer, so this is the
 * only surface the page can reach. It exposes window placement and nothing
 * else — no filesystem, no shell, no process access.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('unloadDesktop', {
  /** Marks this build as running inside the desktop shell. */
  isDesktop: true,

  /** Grow/shrink the pet window when the speech bubble appears. */
  setTalking: (talking) => ipcRenderer.send('pet:talking', Boolean(talking)),

  /** Hide or show the pet, driven by the existing Settings toggle. */
  setPetVisible: (visible) => ipcRenderer.send('pet:visible', Boolean(visible)),

  /** Dragging Mochi around the desktop. */
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragMove: (dx, dy) => ipcRenderer.send('pet:drag-move', { dx, dy }),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),

  /** Bring the main UNLOAD window to the front. */
  focusMain: () => ipcRenderer.send('main:focus'),
})
