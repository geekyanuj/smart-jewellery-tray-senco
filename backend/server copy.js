const { SerialPort } = require("serialport");

const port = new SerialPort({
  path: "COM6",
  baudRate: 9600,
});

const COMMANDS = [
  [0xFF, 0x00, 0x2A, 0x1D, 0x25], // WAKEUP
  [0xFF, 0x03, 0x91, 0x02, 0x01, 0x01, 0x42, 0xC5], // ANTENNA

  // 🔥 Full power stabilization (from your log)
  [0xFF, 0x02, 0x6B, 0x05, 0x10, 0x3A, 0x7F],
  [0xFF, 0x02, 0x6B, 0x05, 0x02, 0x3A, 0x6D], // ✅ 5 dBm
  [0xFF, 0x02, 0x6B, 0x05, 0x00, 0x3A, 0x6F],
  [0xFF, 0x02, 0x6B, 0x05, 0x01, 0x3A, 0x6E],
  [0xFF, 0x02, 0x6B, 0x05, 0x12, 0x3A, 0x7D],
];

let step = 0;

port.on("open", () => {
  console.log("✅ Reader Ready...");
  runSetup();
});

function runSetup() {
  if (step >= COMMANDS.length) {
    console.log("🚀 Scanning...");
    startScan();
    return;
  }

  port.write(Buffer.from(COMMANDS[step]));
  step++;
  setTimeout(runSetup, 800);
}

// Binary buffer (IMPORTANT: not string)
let buffer = Buffer.alloc(0);

port.on("data", (data) => {
  buffer = Buffer.concat([buffer, data]);

  while (buffer.length > 5) {
    // Find packet start
    const start = buffer.indexOf(0xFF);
    if (start === -1) {
      buffer = Buffer.alloc(0);
      return;
    }

    if (buffer.length < start + 3) return;

    const len = buffer[start + 1]; // length byte
    const totalLen = len + 2; // FF + LEN + DATA

    if (buffer.length < start + totalLen) return;

    const packet = buffer.slice(start, start + totalLen);

    // Remove processed packet
    buffer = buffer.slice(start + totalLen);

    parsePacket(packet);
  }
});

let tagCounts = {};

let lastSeen = {};

function parsePacket(packet) {
  if (packet[2] !== 0x29) return;

  // ❌ Ignore short packets (fake responses)
  if (packet.length < 20) return;

  try {
    // Remove CRC
    const data = packet.slice(0, -2);

    // Extract EPC (last 12 bytes typical)
    const epcBuffer = data.slice(-12);
    const epc = epcBuffer.toString("hex").toUpperCase();

    // ❌ Filter garbage
    if (epc.startsWith("FF") || epc.length < 20) return;

    const now = Date.now();

    // ⏱️ Avoid duplicate spam (same tag within 1 sec)
    if (lastSeen[epc] && now - lastSeen[epc] < 1000) return;

    lastSeen[epc] = now;

    // Count
    tagCounts[epc] = (tagCounts[epc] || 0) + 1;

    console.log(`💎 TAG: ${epc} | Count: ${tagCounts[epc]}`);
  } catch (e) {}
}

function startScan() {
  setInterval(() => {
    port.write(Buffer.from([0xFF, 0x00, 0x2A, 0x1D, 0x25]));

    setTimeout(() => {
      port.write(
        Buffer.from([0xFF, 0x05, 0x22, 0x00, 0x00, 0x13, 0x03, 0xE8, 0x29, 0x05])
      );
    }, 200);

    setTimeout(() => {
      port.write(
        Buffer.from([0xFF, 0x03, 0x29, 0x01, 0xFF, 0x00, 0x1B, 0x03])
      );
    }, 1200);
  }, 2500);
}