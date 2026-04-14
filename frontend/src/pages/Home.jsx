import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Home() {
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    socket.on("rfid-data", setActiveItem);

    socket.on("tag-removed", (data) => {
      setActiveItem((cur) =>
        cur?.epc === data.epc ? null : cur
      );
    });

    return () => {
      socket.off("rfid-data");
      socket.off("tag-removed");
    };
  }, []);

  // 📱 Detect mobile/tablet
  const isKiosk = window.innerWidth < 1024;

  return (
    <div className="min-h-screen bg-black text-white">
      {!isKiosk && (
        <header className="p-6 border-b border-gray-800">
          <h1 className="text-2xl text-blue-500">
            TE TECH SMART TRAY
          </h1>
        </header>
      )}

      {activeItem ? (
        <div className="p-6">
          {!isKiosk && (
            <>
              <p className="text-blue-400">Playing</p>
              <h2 className="text-2xl">{activeItem.name}</h2>
            </>
          )}

          <div className="w-full h-[80vh]">
            <iframe
              key={activeItem.epc}
              src={activeItem.video}
              className="w-full h-full"
              allow="autoplay"
            />
          </div>
        </div>
      ) : (
        !isKiosk && (
          <p className="text-center mt-20 text-gray-500">
            Place item on tray
          </p>
        )
      )}
    </div>
  );
}

export default Home;