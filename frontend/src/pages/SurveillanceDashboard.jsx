import React, { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const cameraList = [
  { id: 1, label: "Main Gate" },
  { id: 2, label: "Library" },
  { id: 3, label: "Hostel Block A" },
  { id: 4, label: "Hostel Block B" },
  { id: 5, label: "Cafeteria" },
  { id: 6, label: "Parking Lot" },
  { id: 7, label: "Lecture Hall 1" },
  { id: 8, label: "Lecture Hall 2" },
  { id: 9, label: "Admin Office" },
  { id: 10, label: "Playground" },
];

const SurveillanceDashboard = () => {
  const [images, setImages] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, cameraId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setImages((prev) => ({ ...prev, [cameraId]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = cameraList
        .filter((cam) => images[cam.id])
        .map((cam) => ({
          cameraId: cam.id,
          location: cam.label,
          image: images[cam.id],
        }));

      const response = await axiosInstance.post("/incident/detect", {
        cameras: data,
      });

      setResults(response.data.results);
      toast.success("Detection completed!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze images.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = results.map((res) => ({
    location: res.location,
    fire: res.fire ? 1 : 0,
    smoke: res.smoke ? 1 : 0,
    crowd: res.crowd ? 1 : 0,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Campus Surveillance Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameraList.map((cam) => (
          <div key={cam.id} className="p-4 border rounded shadow bg-white">
            <h3 className="font-semibold">{cam.label}</h3>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, cam.id)} />
            {images[cam.id] && (
              <img src={images[cam.id]} alt="Preview" className="mt-2 max-h-48 rounded" />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Detecting..." : "Analyze All Cameras"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Detection Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((res, idx) => (
              <div key={idx} className="p-4 border rounded bg-gray-50">
                <h4 className="font-semibold">{res.location}</h4>
                <p>🔥 Fire: {res.fire ? "Yes" : "No"}</p>
                <p>💨 Smoke: {res.smoke ? "Yes" : "No"}</p>
                <p>👥 Crowd: {res.crowd ? "Yes" : "No"}</p>
                <p>📍 Location: {res.location}</p>
                <p>🚨 Alerts Sent: {res.alerts?.join(", ") || "None"}</p>
              </div>
            ))}
          </div>

          <h4 className="text-lg font-bold mt-10 mb-4">Incident Overview</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="location" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="fire" stackId="a" fill="#dc2626" />
              <Bar dataKey="smoke" stackId="a" fill="#f59e0b" />
              <Bar dataKey="crowd" stackId="a" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SurveillanceDashboard;
