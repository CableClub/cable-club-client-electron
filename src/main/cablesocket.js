import WebSocket from 'ws'
import { Socket } from 'phoenix'
import { EventEmitter } from 'events'

class CableSocket extends EventEmitter {
  constructor(cablelink) {
    super()
    this.socket = null
    this.channel = null
    this.cablelink = cablelink
  }

  connect(token) {
    this.socket = new Socket("ws://localhost:4000/pokemon/gen1", { transport: WebSocket, params: { token: token } })
    this.channel = this.socket.channel("v1", {})

    // write data to the cablelink when a transfer happens
    this.channel.on("session.transfer", this.cablelink.session_transfer)
    this.cablelink.on("session.transfer", this.session_transfer)

    return new Promise((resolve, reject) => {
      this.channel.join()
        .receive("ok", (response) => resolve(response))
        .receive("error", (reason) => reject(reason))
        .receive("timeout", () => reject("timeout"))
      this.socket.connect()
    })
  }

  disconnect() {
    return this.socket.disconnect()
  }

  session_create() {
    return new Promise((resolve, reject) => {
      this.channel.push("session.create", {})
        .receive("ok", (response) => resolve(response.code))
        .receive("error", (error) => reject(error.reason))
        .receive("timeout", () => reject("timeout"))
    });
  }

  session_join(code) {
    return new Promise((resolve, reject) => {
      this.channel.push("session.join", { code })
        .receive("ok", (response) => resolve(response))
        .receive("error", (error) => reject(error.reason))
        .receive("timeout", () => reject("timeout"))
    });
  }

  session_stop() {
    return new Promise((resolve, reject) => {
      this.channel.push("session.stop", {})
        .receive("ok", (response) => resolve(response))
        .receive("error", (error) => reject(error.reason))
        .receive("timeout", () => reject("timeout"))
    })
  }

  session_transfer(data) {
    return new Promise((resolve, reject) => {
      this.channel.push("session.transfer", { data })
        .receive("ok", (response) => resolve(response))
        .receive("error", (error) => reject(error.reason))
        .receive("timeout", () => reject("timeout"))
    })
  }
}
module.exports = { CableSocket }