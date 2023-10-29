import {createConnection} from 'node:net';

export const AUTH = 3;
export const AUTH_RESPONSE = 2;
export const EXECCOMMAND = 2;
export const RESPONSE_VALUE = 0;

export function createMessage(type, id, body) {

	const size   = Buffer.byteLength(body) + 14,
	    buffer = Buffer.alloc(size);

	buffer.writeInt32LE(size - 4, 0);
	buffer.writeInt32LE(id,       4);
	buffer.writeInt32LE(type,     8);
	buffer.write(body, 12, size - 2, "ascii");
	buffer.writeInt16LE(0, size - 2);

	return buffer;
};

export function readMessage(buffer) {

	const response = {
		size: buffer.readInt32LE(0),
		id:   buffer.readInt32LE(4),
		type: buffer.readInt32LE(8),
		body: buffer.toString("ascii", 12, buffer.length - 2)
	}

	return response;
};

export function sendCommand(command, host, port, password) {
  return new Promise((resolve, reject) => {
    const socket = createConnection(port, host, () => {
      socket.on('data', (data) => {
        const response = readMessage(data);
        switch (response.type) {
          case AUTH_RESPONSE: {
            if (response.id != -1) {
              console.log("Authenticated!")
              const message = createMessage(EXECCOMMAND, 100, command);
              socket.write(message);
            } else {
              console.log("Auth failed. Closing");
              socket.destroy();
              reject();
            }
            break;
          }
          case RESPONSE_VALUE: {
            console.log(`[${response.id}]: ${response.body}`);
            socket.destroy();
            resolve(response.body);
            break;
          }
        }
      });
      const message = createMessage(AUTH, 1, password);
      socket.write(message);
  });
  socket.setTimeout(30000);
  socket.on('error', (error) => {
    reject(error);
    socket.destroy();
  })
  socket.on('timeout', () => {
    reject(new Error("Socket timeout"));
    socket.destroy();
  })
})
}
