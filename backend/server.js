// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const mqtt = require("mqtt");
// const cors = require("cors");
// const path = require("path");

// const app = express();
// app.use(cors());
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// let isDatabaseConnected = true;

// function checkDatabaseConnection() {
//   return isDatabaseConnected;
// }

// // MQTT Setup
// const mqttClient = mqtt.connect("mqtt://127.0.0.1:1883", {
//   reconnectPeriod: 2000,
// });

// mqttClient.on("connect", () => {
//   console.log("🟢 MQTT Connected");
//   mqttClient.subscribe("tray/rfid");
// });

// mqttClient.on("error", (err) => {
//   console.error("🔴 MQTT Error:", err.message);
// });

// mqttClient.on("offline", () => console.warn("🟡 MQTT Offline"));
// mqttClient.on("reconnect", () => console.log("🔄 Reconnecting..."));

// // Mock DB
// const database = {
//   E200001C121502010840B00C: {
//     name: "22K Gold Wedding Band",
//     video: "https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&loop=1",
//   },
//   E200001C121502130840C05E: {
//     name: "Diamond Necklace",
//     video: "https://www.youtube.com/embed/ANOTHER_VIDEO?autoplay=1&loop=1",
//   },
// };

// const activeTags = new Map();
// const TAG_TIMEOUT = 1500;

// // MQTT Message Handler
// mqttClient.on("message", (topic, message) => {
//   if (topic !== "tray/rfid" || !checkDatabaseConnection()) return;

//   try {
//     const { epc, rssi } = JSON.parse(message.toString());

//     if (!epc) return;

//     activeTags.set(epc, Date.now());

//     if (database[epc]) {
//       io.emit("rfid-data", {
//         epc,
//         ...database[epc],
//         rssi,
//       });
//     }
//   } catch (err) {
//     console.error("❌ Invalid MQTT payload");
//   }
// });

// // Tag removal detection
// setInterval(() => {
//   const now = Date.now();

//   for (const [epc, lastSeen] of activeTags) {
//     if (now - lastSeen > TAG_TIMEOUT) {
//       io.emit("tag-removed", { epc });
//       activeTags.delete(epc);
//     }
//   }
// }, 1000);


// // Serve static files from frontend build
// app.use(express.static(path.join(__dirname, "../frontend/dist")));

// // Handle React routing (IMPORTANT)
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
// });


// server.listen(5000, "0.0.0.0", () => {
//   console.log("🚀 Server running on http://192.168.31.216:5000");
// });




const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const cors = require("cors");
const path = require("path");

const Item = require("./models/Item");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🧠 DATABASE CONNECTION
========================= */

let isDatabaseConnected = false;

mongoose.connect(
  "mongodb://admin:Admin%407998@localhost:27017/smart-tray?authSource=admin",
  {
    serverSelectionTimeoutMS: 5000,
  }
);

mongoose.connection.on("connected", () => {
  isDatabaseConnected = true;
  console.log("🟢 MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  isDatabaseConnected = false;
  console.error("🔴 MongoDB Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  isDatabaseConnected = false;
  console.warn("🟡 MongoDB Disconnected");
});

/* =========================
   📡 ROUTES
========================= */

app.use("/api/items", require("./routes/items"));

/* =========================
   🚀 SOCKET.IO SERVER
========================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

/* =========================
   📶 MQTT SETUP
========================= */

let isMqttConnected = false;

const mqttClient = mqtt.connect("mqtt://127.0.0.1:1883", {
  reconnectPeriod: 2000,
  connectTimeout: 4000,
});

mqttClient.on("connect", () => {
  isMqttConnected = true;
  console.log("🟢 MQTT Connected");

  mqttClient.subscribe("tray/rfid", (err) => {
    if (err) {
      console.error("❌ MQTT Subscribe Error:", err.message);
    } else {
      console.log("📡 Subscribed to topic: tray/rfid");
    }
  });
});

mqttClient.on("error", (err) => {
  isMqttConnected = false;
  console.error("🔴 MQTT Error:", err.message);
});

mqttClient.on("offline", () => {
  isMqttConnected = false;
  console.warn("🟡 MQTT Offline");
});

mqttClient.on("reconnect", () => {
  console.log("🔄 MQTT Reconnecting...");
});

mqttClient.on("close", () => {
  isMqttConnected = false;
  console.warn("⚫ MQTT Connection Closed");
});

/* =========================
   📊 RFID PROCESSING
========================= */

const activeTags = new Map();
const TAG_TIMEOUT = 1500;

mqttClient.on("message", async (topic, message) => {
  if (topic !== "tray/rfid") return;

  if (!isDatabaseConnected) {
    console.warn("⚠️ Skipping message: DB not connected");
    return;
  }

  try {
    const parsed = JSON.parse(message.toString());

    const { epc, rssi } = parsed;

    if (!epc) {
      console.warn("⚠️ Invalid payload: Missing EPC");
      return;
    }

    console.log(`📥 Tag Detected: ${epc} | RSSI: ${rssi}`);

    activeTags.set(epc, Date.now());

    const item = await Item.findOne({ epc });

    if (!item) {
      console.warn(`⚠️ No item found in DB for EPC: ${epc}`);
      return;
    }

    console.log(`🎬 Playing: ${item.name}`);

    io.emit("rfid-data", {
      epc,
      name: item.name,
      video: item.video,
      rssi,
    });

  } catch (err) {
    console.error("❌ Invalid MQTT payload:", err.message);
  }
});

/* =========================
   🧹 TAG REMOVAL DETECTION
========================= */

setInterval(() => {
  const now = Date.now();

  for (const [epc, lastSeen] of activeTags) {
    if (now - lastSeen > TAG_TIMEOUT) {
      console.log(`❌ Tag Removed: ${epc}`);

      io.emit("tag-removed", { epc });
      activeTags.delete(epc);
    }
  }
}, 1000);

/* =========================
   🌐 FRONTEND SERVE
========================= */

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

/* =========================
   ❤️ HEALTH CHECK ROUTE
========================= */

app.get("/health", (req, res) => {
  res.json({
    mqtt: isMqttConnected ? "connected" : "disconnected",
    database: isDatabaseConnected ? "connected" : "disconnected",
  });
});

/* =========================
   🚀 SERVER START
========================= */

server.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Server running on port 5000");
});