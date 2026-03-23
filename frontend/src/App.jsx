import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// ✅ safer connection
const socket = io("http://127.0.0.1:5000");

function App() {
  const [logs, setLogs] = useState([]);
  const [latestTag, setLatestTag] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connected to server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected");
      setConnected(false);
    });

    socket.on("rfid-data", (data) => {
      console.log("📡 Received:", data);

      setLatestTag(data);
      setLogs((prev) => [data, ...prev].slice(0, 10));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("rfid-data");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-5 font-mono text-[#00ff00]">
      
      {/* HEADER */}
      <header className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          💎 RFID Live Debugger
        </h2>
        <p className="text-sm text-gray-400">
          Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
        <hr className="mt-2 border-[#333]" />
      </header>

      {/* CURRENT TAG */}
      <section className={`mb-8 rounded-lg border-2 p-6 transition-all duration-300 ${
        latestTag ? "border-[#00ff00]" : "border-[#333]"
      }`}>
        <h3 className="mb-4 text-sm text-gray-400">
          CURRENT TAG
        </h3>

        {latestTag ? (
          <div className="space-y-2">
            <p>
              <span className="text-gray-400">EPC:</span>{" "}
              <span className="text-white font-bold">
                {latestTag.epc}
              </span>
            </p>

            <p>
              <span className="text-gray-400">RSSI:</span>{" "}
              {latestTag.rssi}
            </p>

            <p>
              <span className="text-gray-400">Time:</span>{" "}
              {latestTag.timestamp}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 animate-pulse">
            Waiting for tag...
          </p>
        )}
      </section>

      {/* LOG TABLE */}
      <div>
        <h3 className="mb-4 text-sm text-gray-400">LOGS</h3>

        <table className="w-full border border-[#333]">
          <thead className="bg-[#2a2a2a] text-gray-400 text-xs">
            <tr>
              <th className="p-2 border border-[#333]">Time</th>
              <th className="p-2 border border-[#333]">EPC</th>
              <th className="p-2 border border-[#333]">RSSI</th>
              <th className="p-2 border border-[#333]">Raw</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-[#252525]">
                <td className="p-2 border border-[#333]">{log.timestamp}</td>
                <td className="p-2 border border-[#333] text-yellow-400">
                  {log.epc}
                </td>
                <td className="p-2 border border-[#333]">{log.rssi}</td>
                <td className="p-2 border border-[#333] text-xs text-gray-500 truncate max-w-xs">
                  {log.raw}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;