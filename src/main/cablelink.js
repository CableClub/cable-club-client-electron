import SerialPort from 'serialport'
import { EventEmitter } from 'events'

class CableLink extends EventEmitter {
  constructor(tty) {
    super()
    this.tty = tty
    this.uart = null
  }

  connect() {
    this.uart = new SerialPort(this.tty, {
      baudRate: 115200
    })

    uart.on('readable', this.readable)
  }

  readable() {
    this.emit("session.transfer", { data: uart.read(1)[0] })
  }

  session_transfer(data) {
    this.uart.write([data])
  }
}

module.exports = { CableLink }