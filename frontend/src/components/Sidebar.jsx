import { Link, useLocation } from "react-router-dom";
import { FaHome, FaTable, FaCog } from "react-icons/fa";
import logo from "../assets/Icon_Senco1.png";

const features = [
  { name: "Home", to: "/", icon: <FaHome /> },
  { name: "Admin", to: "/admin", icon: <FaTable /> },
  { name: "Settings", to: "#", icon: <FaCog /> },
];

function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 flex flex-col shadow-lg">
      <div className="mb-8 flex items-center gap-3">
        <img src={logo} alt="Logo" className=" rounded" />
        {/* <span className="text-2xl font-bold tracking-tight text-gold-600" style={{ color: '#d4af37' }}>Smart Tray</span> */}
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f.name}>
              <Link
                to={f.to}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium hover:bg-gray-700 ${location.pathname === f.to ? 'bg-gray-700 text-gold-400' : ''}`}
              >
                <span className="text-lg">{f.icon}</span>
                <span>{f.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-8 text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} TeTech</div>
    </aside>
  );
}

export default Sidebar;