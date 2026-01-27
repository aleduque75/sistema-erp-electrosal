const net = require('net');
const host = 'localhost';
const port = 3002;
const retryInterval = 1000;
const timeout = 30000; // 30 seconds

const startTime = Date.now();

function checkPort() {
  if (Date.now() - startTime > timeout) {
    console.error('Timeout waiting for port', port);
    process.exit(1);
  }

  const socket = new net.Socket();
  socket.once('connect', () => {
    console.log('Port', port, 'is open. Starting next command.');
    socket.destroy();
    process.exit(0);
  });
  socket.once('error', (err) => {
    // console.log('Port not open yet, retrying...');
    socket.destroy();
    setTimeout(checkPort, retryInterval);
  });
  socket.connect(port, host);
}

checkPort();
