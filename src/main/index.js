'use strict'

import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import log from 'electron-log'
import WebSocket from 'ws'
import SerialPort from 'serialport'
import { Socket } from 'phoenix'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) {
  app.quit();
}

let socket = new Socket("ws://localhost:4000/usb", { transport: WebSocket });
let channel = socket.channel("usb:v1", { session_code: '123456', session_token: 'j5Db1OuPOr35VbXuwWBiqsmQicODgc2GEVL_vjL3ReM=' })

channel.join()
  .receive("ok", ({ data }) => log.debug("channel connected", data))
  .receive("error", ({ reason }) => log.debug("failed join", reason))
  .receive("timeout", () => log.debug("Networking issue. Still waiting..."))

let uart = new SerialPort('/dev/ttyUSB1', {
  baudRate: 115200
})

uart.on('readable', function () {
  channel.push("exchange_byte", { data: uart.read(1)[0] })
})

channel.on("exchange_byte", (payload) => {
  uart.write([payload.data], (error) => {
    log.error(error)
  })
})

socket.connect();

// Set this to avoid a warning and to improve performance
app.allowRendererProcessReuse = true;

function createMainWindow() {
  const window = new BrowserWindow({ webPreferences: { nodeIntegration: true } })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})

app.on('second-instance', (e, cmdline, workingDirectory) => {
  log.debug("second instance")
  log.debug(decodeURI(cmdline[1]))
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('open-url', (e, url) => {
  log.debug("open-url")
})
