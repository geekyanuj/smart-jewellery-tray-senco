import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Mapping your RFID Tags to specific Video files
const AD_DATABASE = {
  "E28011912000": { name: "Gold Necklace", video: "/videos/gold_ad.mp4" },
  "E20041052000": { name: "Diamond Ring", video: "/videos/diamond_ad.mp4" },
  "DEFAULT": { name: "Welcome", video: "/videos/brand_loop.mp4" }
};

function App() {
  const [currentTag, setCurrentTag] = useState(null);
  const [adInfo, setAdInfo] = useState(AD_DATABASE["DEFAULT"]);
  const videoRef = useRef(null);

  useEffect(() => {
    socket.on("rfid-scan", (data) => {
      console.log("New Tag:", data.epc);
      setCurrentTag(data);

      // Check if we have an ad for this tag
      if (AD_DATABASE[data.epc]) {
        setAdInfo(AD_DATABASE[data.epc]);
      }
    });

    return () => socket.off("rfid-scan");
  }, []);

  // Auto-play video when ad changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [adInfo]);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', textAlign: 'center' }}>
      <header style={{ padding: '20px' }}>
        <h2>{adInfo.name} - Premium Collection</h2>
        {currentTag && <p style={{color: '#666'}}>Tag ID: {currentTag.epc} | Signal: {currentTag.rssi}dBm</p>}
      </header>

      <div style={{ width: '80%', margin: '0 auto', border: '5px solid #d4af37' }}>
        <video 
          ref={videoRef}
          width="100%" 
          autoPlay 
          loop 
          muted 
          style={{ display: 'block' }}
        >
          <source src={adInfo.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <footer style={{ marginTop: '20px' }}>
        <p>Place an item on the tray to see details</p>
      </footer>
    </div>
  );
}

export default App;