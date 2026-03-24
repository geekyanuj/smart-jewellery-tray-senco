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
const TAG_TIMEOUT = 3000; // 3 seconds of silence = Tag Removed

// Mapping EPCs to Products
// const JEWELRY_DATABASE = {
//   "E200001C121502130840C05E": { name: "Senco Sutra - the Mangasutra Collection", video: "senco_sutra.mp4" },
//   "E200001C121502010840B00C": { name: "Vivaha Collection", video: "vivaha_collection.mp4" }
// };

const JEWELRY_DATABASE = {
  "E200001C121502130840C05E": {
    name: "Senco Sutra - the Mangasutra Collection",
    video: "https://www.youtube.com/embed/qm7VBAvx7U0?autoplay=1&mute=1&loop=1&playlist=qm7VBAvx7U0&controls=0&modestbranding=1&rel=0"
  },
  "E200001C121502010840B00C": {
    name: "Vivaha Collection",
    video: "https://www.youtube.com/embed/EQFUXeJWjyM?autoplay=1&mute=1&loop=1&playlist=EQFUXeJWjyM&controls=0&modestbranding=1&rel=0"
  }
};

const port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE, autoOpen: false });

// COMMANDS
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
let activeTags = {}; // { EPC: Timestamp }

port.on("data", (chunk) => {
  serialBuffer = Buffer.concat([serialBuffer, chunk]);
  while (serialBuffer.length >= 5) {
    if (serialBuffer[0] !== 0xFF) { serialBuffer = serialBuffer.subarray(1); continue; }
    const dataLength = serialBuffer[1];
    const totalPacketLength = dataLength + 5 + 2; 
    if (serialBuffer.length < totalPacketLength) break;

    const packet = serialBuffer.subarray(0, totalPacketLength);
    const hex = packet.toString("hex").toUpperCase();

    if (packet[2] === 0x29 && hex.includes("E2")) {
      const epcStart = hex.indexOf("E2");
      const epc = hex.substring(epcStart, epcStart + 24);

      // RSSI Logic from analysis
      const rssiByteIdx = (epcStart / 2) + 12;
      const rssiRaw = packet[rssiByteIdx];
      let rssi = rssiRaw > 127 ? rssiRaw - 256 : rssiRaw - 128;
      if (rssi > 0) rssi = -Math.abs(rssi);

      if (epc.length === 24) {
        const product = JEWELRY_DATABASE[epc] || { name: "Unknown Item", video: "default.mp4" };
        
        // Update presence
        activeTags[epc] = Date.now();

        io.emit("rfid-data", { 
          epc, 
          rssi: `${rssi} dBm`, 
          name: product.name,
          video: product.video,
          timestamp: new Date().toLocaleTimeString() 
        });
      }
    }
    serialBuffer = serialBuffer.subarray(totalPacketLength);
  }
});

// Clean up: Check for removed tags every second
setInterval(() => {
  const now = Date.now();
  Object.keys(activeTags).forEach(epc => {
    if (now - activeTags[epc] > TAG_TIMEOUT) {
      console.log(`🚫 TAG REMOVED: ${epc}`);
      io.emit("tag-removed", { epc });
      delete activeTags[epc];
    }
  });
}, 1000);

server.listen(5000, () => console.log("🚀 Server running on port 5000"));