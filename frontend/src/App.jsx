import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5000");

function App() {
  const [activeItem, setActiveItem] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on("rfid-data", (data) => {
      // Logic: Only update if it's the strongest tag or first tag
      setActiveItem(data);
      setLogs((prev) => [data, ...prev].slice(0, 8));
    });

    socket.on("tag-removed", (data) => {
      setActiveItem((current) => {
        // Only clear if the removed tag is the one we are currently showing
        return current?.epc === data.epc ? null : current;
      });
    });

    return () => {
      socket.off("rfid-data");
      socket.off("tag-removed");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center border-b border-gray-800 pb-5 mb-10">
          <h1 className="text-3xl font-bold tracking-tighter text-blue-500">TE TECH SMART TRAY</h1>
          <div className="text-xs uppercase text-gray-500">Live Status: Connected</div>
        </header>

        {/* VIDEO DISPLAY AREA */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-video bg-black rounded-2xl border border-gray-800 flex items-center justify-center overflow-hidden shadow-2xl">
            {activeItem ? (
              <div className="text-center">
                <p className="text-blue-400 text-sm mb-2 uppercase tracking-widest">Playing Presentation</p>
                <h2 className="text-4xl font-bold mb-4">{activeItem.name}</h2>
                {/* Replace with <video src={activeItem.video} autoPlay loop /> */}
                <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="text-gray-600 text-center">
                <p className="text-xl italic">Please place an item on the smart tray to begin</p>
              </div>
            )}
          </div>

          {/* SENSOR DATA */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-gray-500 text-xs uppercase mb-4">Signal Strength</h3>
              <div className="text-5xl font-mono text-green-400">
                {activeItem ? activeItem.rssi : "--"}
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-gray-500 text-xs uppercase mb-2">System Logs</h3>
              <div className="h-40 overflow-y-auto space-y-2 text-xs font-mono">
                {logs.map((log, i) => (
                  <div key={i} className="text-gray-400 border-l border-blue-500 pl-2">
                    [{log.timestamp}] Detected {log.epc.substring(20)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;