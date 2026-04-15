# 💎 TE Tech Smart Tray  
**RFID Jewelry Presentation System**

An industrial-grade IoT solution that seamlessly bridges **physical jewelry inventory** with **interactive digital media**. The Smart Tray detects RFID-tagged items placed on its surface and instantly triggers high-definition product videos in real time.

---

## 🚀 Overview

The **TE Tech Smart Tray** combines hardware and software to create a next-generation retail experience:

- Detects RFID-tagged jewelry using a compatible reader  
- Processes EPC data through a Node.js backend  
- Streams real-time events via WebSockets  
- Displays corresponding product videos on a React-based frontend  

This creates a **touchless, immersive product showcase system** ideal for modern jewelry retail environments.

---

## 🛠️ Tech Stack

### Backend (IoT Core)
- **Node.js** – Event-driven runtime  
- **SerialPort** – RS232/USB communication with RFID reader  
- **Socket.io** – Real-time bi-directional communication  
- **Express** – Static asset serving  

### Frontend (UX/UI)
- **React.js** – Component-based UI  
- **Tailwind CSS** – Modern dark-mode interface  
- **Socket.io Client** – Real-time event listener  

---

## 📂 Project Structure

```
.
smart-tray/
├── backend/
│   ├── server.js               # RFID processing & Socket server (from iwss/index.js)
│   ├── package.json            # Dependencies (from iwss/package.json)
│   └── media/                  # Video assets (optional hosting, new folder)
└── frontend/
    ├── src/
    │   └── App.js              # UI & real-time trigger logic (combines iwss-frontend/src/services.ts, pages, components)
    ├── public/
    │   └── videos/             # Local video storage (from iwss-frontend/src/assets or new folder)
    └── package.json            # Dependencies (from iwss-frontend/package.json)

```


## 📡 Protocol Details (Mercury API)

- **Scan Cycle:** ~2.5 seconds  
  - KeepAlive → Search → Fetch  

- **EPC Filtering:**  
  - Strict 24-character hexadecimal validation  
  - Eliminates ghost reads and metadata noise  

- **RSSI Calculation:**  
  - Signal strength = `(Value - 128)`  
  - Used for proximity-based detection  

- **Tag Removal Logic:**  
  - 3-second timeout heartbeat  
  - Detects when jewelry is removed from the tray  

---

## 🧪 Use Cases

- Jewelry retail showrooms  
- Smart display counters  
- Interactive exhibitions  
- Luxury product demonstrations  

---

## 📝 License

**Proprietary Software – TE Tech Solution © 2026**

This software is the exclusive property of **TE Tech Solution**.

- Unauthorized copying, distribution, or modification is strictly prohibited  
- Usage is permitted only under explicit agreement or license from the owner  
- All rights reserved  

For licensing inquiries, contact: **[info@tetechsolution.com]**
