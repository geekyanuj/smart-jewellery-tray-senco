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

let serialBuffer = Buffer.alloc(0);

port.on("data", (chunk) => {
  serialBuffer = Buffer.concat([serialBuffer, chunk]);

  while (serialBuffer.length >= 5) {
    if (serialBuffer[0] !== 0xFF) {
      serialBuffer = serialBuffer.subarray(1);
      continue;
    }

    const dataLength = serialBuffer[1];
    const totalPacketLength = dataLength + 5 + 2; 

    if (serialBuffer.length < totalPacketLength) break;

    const packet = serialBuffer.subarray(0, totalPacketLength);
    const hex = packet.toString("hex").toUpperCase();

    if (packet[2] === 0x29 && hex.includes("E2")) {
      const epcStart = hex.indexOf("E2");
      const epc = hex.substring(epcStart, epcStart + 24);

      // The byte immediately after the 24-char (12-byte) EPC
      const rssiByteIdx = (epcStart / 2) + 12;
      const rssiRaw = packet[rssiByteIdx];
      
      // Mercury API RSSI Logic: If the value is > 128, it's already negative.
      // If it's a high positive number like 92 (5C), we subtract 128.
      let rssi = rssiRaw > 128 ? rssiRaw - 256 : rssiRaw - 128;

      // Ensure we don't show impossible values
      if (rssi > 0) rssi = -Math.abs(rssi); 

      if (epc.length === 24) {
        console.log(`✨ TAG: ${epc} | RSSI: ${rssi} dBm`);
        io.emit("rfid-data", { 
          epc, 
          rssi: `${rssi} dBm`, 
          timestamp: new Date().toLocaleTimeString() 
        });
      }
    }
    serialBuffer = serialBuffer.subarray(totalPacketLength);
  }
});
server.listen(5000, () => console.log("🚀 Server running on port 5000"));