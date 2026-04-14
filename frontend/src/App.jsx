import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";


const socket = io("http://192.168.31.216:5000");

function App() {
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    socket.on("rfid-data", (data) => {
      // Logic: Only update if it's the strongest tag or first tag
      setActiveItem(data);
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
          <h1 className="text-3xl font-bold tracking-tighter text-blue-500">
            TE TECH SMART TRAY
          </h1>
          <div className="text-xs uppercase text-gray-500">
            Live Status: Connected
          </div>
        </header>

        {/* VIDEO DISPLAY AREA */}
        {activeItem ? (
          <div className="w-full">
            <p className="text-blue-400 text-sm mb-2 uppercase tracking-widest">
              Playing Presentation
            </p>
            <h2 className="text-2xl font-bold mb-4">{activeItem.name}</h2>

            <div className="aspect-video w-full h-[65vh]  bg-black rounded-2xl overflow-hidden">
              <iframe
                key={activeItem.epc}
                src={activeItem.video}
                title={activeItem.name}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-center">
            <p className="text-xl italic">
              Please place an item on the smart tray to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
