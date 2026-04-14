
import { useEffect, useState } from "react";
import API from "../api";

import Sidebar from "../components/Sidebar";


export default function Admin() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [form, setForm] = useState({ epc: "", name: "", video: "" });
  const [editId, setEditId] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isKiosk, setIsKiosk] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const check = () => setIsKiosk(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get("/items");
      setItems(res.data);
    } catch (e) {
      setErrorMsg("Failed to fetch items");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await API.put(`/items/${editId}`, form);
        setSuccessMsg("Item updated!");
      } else {
        await API.post("/items", form);
        setSuccessMsg("Item added!");
      }
      setForm({ epc: "", name: "", video: "" });
      setEditId(null);
      fetchItems();
    } catch (e) {
      setErrorMsg("Failed to save item");
    }
    setLoading(false);
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 2000);
  };

  const deleteItem = async (id) => {
    setLoading(true);
    try {
      await API.delete(`/items/${id}`);
      setSuccessMsg("Item deleted!");
      fetchItems();
    } catch (e) {
      setErrorMsg("Failed to delete item");
    }
    setShowDelete(false);
    setDeleteId(null);
    setLoading(false);
    setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 2000);
  };

  const handleEdit = (item) => {
    setForm({ epc: item.epc, name: item.name, video: item.video });
    setEditId(item._id);
  };
  const handleCancelEdit = () => {
    setForm({ epc: "", name: "", video: "" });
    setEditId(null);
  };

  // Kiosk/tablet/mobile: only show video, no menu/sidebar/logo
  if (isKiosk) {
    const firstItem = items[0];
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        {firstItem ? (
          <div className="w-full h-[80vh]">
            <iframe
              key={firstItem.epc}
              src={firstItem.video}
              className="w-full h-full"
              allow="autoplay"
              title={firstItem.name}
            />
          </div>
        ) : (
          <p className="text-center text-gray-500">No video available</p>
        )}
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(items.length / rowsPerPage);
  const paginatedItems = items.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Desktop: full admin CRUD UI
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="p-8 w-full">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 flex items-center gap-2">
          <span>Manage Items</span>
          {loading && <span className="ml-2 animate-spin">⏳</span>}
        </h1>
        {successMsg && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{successMsg}</div>}
        {errorMsg && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}

        {/* Form */}
        <form className="flex flex-wrap gap-4 items-end bg-white p-4 rounded shadow mb-8" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold">EPC</label>
            <input className="border rounded px-2 py-1" required value={form.epc} onChange={e => setForm({...form, epc:e.target.value})} placeholder="EPC" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold">Name</label>
            <input className="border rounded px-2 py-1" required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Name" />
          </div>
          <div className="flex flex-col min-w-[250px]">
            <label className="mb-1 text-sm font-semibold">Video URL</label>
            <input className="border rounded px-2 py-1" required value={form.video} onChange={e => setForm({...form, video:e.target.value})} placeholder="Video URL" />
          </div>
          <button
            type="submit"
            className={`px-4 py-2 rounded font-semibold text-white ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            disabled={loading}
          >
            {editId ? 'Update' : 'Add'}
          </button>
          {editId && (
            <button type="button" className="ml-2 px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </form>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-3">EPC</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Video</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(i => (
                <tr key={i._id} className="border-b hover:bg-blue-50">
                  <td className="py-2 px-3 font-mono">{i.epc}</td>
                  <td className="py-2 px-3">{i.name}</td>
                  <td className="py-2 px-3 max-w-xs truncate">
                    <a href={i.video} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Video Link</a>
                  </td>
                  <td className="py-2 px-3 flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white font-semibold"
                      onClick={() => handleEdit(i)}
                      disabled={loading}
                    >Edit</button>
                    <button
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                      onClick={() => { setShowDelete(true); setDeleteId(i._id); }}
                      disabled={loading}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >Prev</button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  className={`px-3 py-1 rounded font-semibold ${page === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setPage(idx + 1)}
                >{idx + 1}</button>
              ))}
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >Next</button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
              <p className="mb-6">Are you sure you want to delete this item?</p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                  onClick={() => { setShowDelete(false); setDeleteId(null); }}
                  disabled={loading}
                >Cancel</button>
                <button
                  className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                  onClick={() => deleteItem(deleteId)}
                  disabled={loading}
                >Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}