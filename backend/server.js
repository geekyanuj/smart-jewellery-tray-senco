const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const COM_PORT = "COM6"; 
const BAUD_RATE = 9600;

const port = new SerialPort({
  path: COM_PORT,
  baudRate: BAUD_RATE,
  autoOpen: false
});

const CMD_KEEPALIVE = Buffer.from([0xFF, 0x00, 0x2A, 0x1D, 0x25]);
const CMD_SEARCH    = Buffer.from([0xFF, 0x05, 0x22, 0x00, 0x00, 0x13, 0x03, 0xE8, 0x29, 0x05]);
const CMD_FETCH     = Buffer.from([0xFF, 0x03, 0x29, 0x01, 0xFF, 0x00, 0x1B, 0x03]);

port.open((err) => {
  if (err) return console.error(`❌ PORT ERROR: ${err.message}`);
  console.log(`✅ Connected to ${COM_PORT}`);
  port.flush(() => setTimeout(startLoop, 1000));
});

function startLoop() {
  console.log("📡 RFID Monitoring Active...");
  setInterval(() => {
    port.write(CMD_KEEPALIVE);
    setTimeout(() => port.write(CMD_SEARCH), 100);
    setTimeout(() => port.write(CMD_FETCH), 1200);
  }, 2500); 
}

// Global Buffer to hold fragmented data
let serialBuffer = Buffer.alloc(0);

port.on("data", (chunk) => {
  // 1. Add new data to our existing buffer
  serialBuffer = Buffer.concat([serialBuffer, chunk]);

  // 2. Process the buffer while it has at least a header (5 bytes: FF, Len, Op, Status_Hi, Status_Lo)
  while (serialBuffer.length >= 5) {
    if (serialBuffer[0] !== 0xFF) {
      // Shift buffer until we find a start byte
      serialBuffer = serialBuffer.subarray(1);
      continue;
    }

    const dataLength = serialBuffer[1];
    const totalPacketLength = dataLength + 5 + 2; // Header(5) + Data + CRC(2)

    if (serialBuffer.length < totalPacketLength) {
      // We don't have the full packet yet, wait for next 'data' event
      break;
    }

    // 3. Extract the full packet
    const packet = serialBuffer.subarray(0, totalPacketLength);
    const opCode = packet[2];
    const hexString = packet.toString("hex").toUpperCase();

    // 4. Check for Tag Result (OpCode 0x29)
    if (opCode === 0x29) {
      const startIdx = hexString.indexOf("E2");
      if (startIdx !== -1) {
        const epc = hexString.substring(startIdx, startIdx + 24);
        
        // RSSI is usually 3 bytes before the CRC end
        const rssiRaw = packet[packet.length - 3];
        const rssi = rssiRaw > 128 ? rssiRaw - 256 : rssiRaw;

        console.log(`✨ TAG DETECTED: ${epc} | RSSI: ${rssi} dBm`);
        io.emit("rfid-data", { epc, rssi: `${rssi} dBm`, timestamp: new Date().toLocaleTimeString() });
      }
    }

    // 5. Remove the processed packet from the buffer
    serialBuffer = serialBuffer.subarray(totalPacketLength);
  }
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));