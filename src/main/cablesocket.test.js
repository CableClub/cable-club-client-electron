import { CableSocket } from "./cablesocket"
let socket;

beforeEach(() => {
  socket = new CableSocket()
  socket.connect("emTopI4niWd3ZlfFwoArwzE6i9rnXe-RiasYQX0DwxY=")
    .then((data) => { })
    .catch((error) => fail(error))
});

afterEach(() => {
  socket.socket.disconnect()
});

test('create a session', () => {
  return socket.session_create().then((code) => {
    expect(code).toBeTruthy()
  })
})

test('join a session', () => {
  return socket.session_create().then((code) => {
    return socket.session_join(code).then((data) => {
      expect(data).toBeTruthy()
    })
  })
})