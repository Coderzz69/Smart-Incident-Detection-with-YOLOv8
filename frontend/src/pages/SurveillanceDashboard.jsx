import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom RED marker icon for extreme danger
const DangerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png"
});

const DEFAULT_POSITION = [17.537926, 78.384897]; // VNRVJIET Main Gate Hyderabad

const ALERT_COOLDOWN = 30000;
const AI_DISPLAY_DELAY = 0;
const THREAT_NOTIFICATION_DELAY = 1000;

const SurveillanceDashboard = ({ user, buildingInfo }) => {
  const [result, setResult] = useState({
    fire_count: 0,
    smoke_count: 0,
    crowd_density: 0,
    location: "E Block",
    location_coords: DEFAULT_POSITION,
    alertType: "None",
    annotated_img_base64: null,
    crowd_annotated_img_base64: null,
  });
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(1000);
  const [threatAnalysis, setThreatAnalysis] = useState("Waiting for first analysis...");
  const [lastAlertTime, setLastAlertTime] = useState({});
  const [showAIResult, setShowAIResult] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [incidentLog, setIncidentLog] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const aiDisplayTimerRef = useRef(null);
  const threatNotificationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
      stopAutoAnalysis();
      clearTimeout(aiDisplayTimerRef.current);
      clearTimeout(threatNotificationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoAnalyze) {
      stopAutoAnalysis();
      startAutoAnalysis();
    }
  }, [analysisInterval]);

  const toggleCamera = async () => {
    if (isCameraActive) stopCamera();
    else await startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error("Camera error: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    stopAutoAnalysis();
  };

  const captureImage = () => {
    if (!isCameraActive || !videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const generateThreatSummary = (data) => {
    const threats = [];
    if (data.fire_count > 0) {
      threats.push({
        level: "CRITICAL",
        message: `🔥 Fire detected (${data.fire_count} ${data.fire_count > 1 ? "locations" : "location"})`,
        actions: ["Activate fire alarms", "Initiate evacuation", "Contact fire department"]
      });
    }
    if (data.smoke_count > 0) {
      threats.push({
        level: "HIGH",
        message: `💨 Smoke detected (${data.smoke_count} ${data.smoke_count > 1 ? "areas" : "area"})`,
        actions: ["Investigate source", "Prepare extinguishers", "Check ventilation"]
      });
    }
    if (data.crowd_density > 0.7) {
      threats.push({
        level: "HIGH",
        message: `👥 Crowd congestion (${Math.round(data.crowd_density * 100)}% density)`,
        actions: ["Deploy security", "Open additional exits", "Monitor choke points"]
      });
    } else if (data.crowd_density > 0.4) {
      threats.push({
        level: "MEDIUM",
        message: `👥 Growing crowd (${Math.round(data.crowd_density * 100)}% density)`,
        actions: ["Monitor situation", "Prepare crowd control"]
      });
    }
    if (threats.length === 0) {
      return {
        summary: "✅ No immediate threats detected\n\nRecommendation: Continue routine monitoring",
        alertType: "None"
      };
    }

    const summary = threats.map(t =>
      `${t.level} RISK: ${t.message}\nACTIONS: ${t.actions.join(", ")}`
    ).join("\n\n");

    const highestRisk = threats.some(t => t.level === "CRITICAL") ? "Fire" :
      threats.some(t => t.level === "HIGH") ? "Crowd" : "Monitor";

    return {
      summary: `🚨 THREAT DETECTED 🚨\n\n${summary}\n\nImmediate attention required.`,
      alertType: highestRisk === "Fire" ? "Fire" : highestRisk === "Crowd" ? "Crowd" : "None"
    };
  };

  const alertOfficials = (alertType, location, info) => {
    const now = Date.now();
    const lastAlert = lastAlertTime[alertType] || 0;
    if (now - lastAlert < ALERT_COOLDOWN) return;
    clearTimeout(threatNotificationTimerRef.current);
    threatNotificationTimerRef.current = setTimeout(() => {
      const alertMap = {
        Fire: { message: `URGENT: Fire detected at ${location}. Immediate response required.` },
        Crowd: { message: `Crowd congestion at ${location} (${Math.round((info?.crowd_density ?? 0) * 100)}% density).` }
      };
      if (alertMap[alertType]) {
        toast.success(`${alertType} alert dispatched: ${alertMap[alertType].message}`, {
          duration: 4000,
          position: 'top-right',
          id: `${alertType}-alert`
        });
        setLastAlertTime(prev => ({ ...prev, [alertType]: now }));
      }
    }, THREAT_NOTIFICATION_DELAY);
  };

  const handleAnalyze = async () => {
    if (!isCameraActive) return;
    if (loading) return;
    const imageData = captureImage();
    if (!imageData) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/incident/detect", { image: imageData });
      const { summary, alertType } = generateThreatSummary(res.data);

      // You can map locations to coords here, for now using DEFAULT_POSITION
      const coords = res.data.location === "E Block" ? DEFAULT_POSITION : DEFAULT_POSITION;

      setResult(prev => ({
        ...prev,
        ...res.data,
        location_coords: coords,
        alertType: alertType || "None"
      }));

      setLastAnalysisTime(new Date());
      setIncidentLog(prev => [...prev.slice(-19), { ...res.data, location_coords: coords, timestamp: new Date() }]);

      if (autoAnalyze) {
        setThreatAnalysis(summary);
        setShowAIResult(true);
      } else {
        setShowAIResult(false);
        clearTimeout(aiDisplayTimerRef.current);
        aiDisplayTimerRef.current = setTimeout(() => {
          setThreatAnalysis(summary);
          setShowAIResult(true);
        }, AI_DISPLAY_DELAY);
      }
      if (alertType && alertType !== "None") {
        alertOfficials(alertType, res.data.location, res.data);
      }
    } catch (err) {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const startAutoAnalysis = () => {
    if (!isCameraActive) return;
    setAutoAnalyze(true);
    handleAnalyze();
    analysisTimerRef.current = setInterval(handleAnalyze, analysisInterval);
  };
  const stopAutoAnalysis = () => {
    setAutoAnalyze(false);
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  };
  const toggleAutoAnalyze = () => {
    if (autoAnalyze) stopAutoAnalysis();
    else startAutoAnalysis();
  };

  const mapPosition = result.location_coords || DEFAULT_POSITION;
  const isExtremeDanger = result.alertType === "Fire" && result.location === "E Block";

  return (
    <div className="pt-16 flex flex-col md:flex-row gap-8 p-6 max-w-7xl mx-auto">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-bold mb-4">AI Surveillance Threat Monitor</h1>
        
        {/* Camera Controls */}
        <div className="border p-4 rounded-lg shadow-md mb-4">
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={toggleCamera}
              className={`px-4 py-2 rounded-md ${isCameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
              {isCameraActive ? "Stop Camera" : "Start Camera"}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!isCameraActive || loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
              {loading ? "Analyzing..." : "Analyze Frame"}
            </button>
            <button
              onClick={toggleAutoAnalyze}
              disabled={!isCameraActive}
              className={`px-4 py-2 rounded-md ${autoAnalyze ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white disabled:opacity-50`}>
              {autoAnalyze ? "Stop Auto" : "Auto Analyze"}
            </button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-96 mx-auto"
              style={{ display: isCameraActive ? 'block' : 'none' }}
            />
            {!isCameraActive && (
              <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-white">
                Camera is inactive
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Analysis Interval (ms):</label>
            <input
              type="number"
              value={analysisInterval}
              onChange={e => {
                const val = parseInt(e.target.value);
                setAnalysisInterval(isNaN(val) ? 50 : Math.max(50, val));
              }}
              min="50"
              step="50"
              className="border p-1 rounded w-24"
              disabled={autoAnalyze}
            />
          </div>
        </div>

        {/* Incident Details and Threat Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Incident Details</h2>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Fire Detection:</span>
                <span className={`font-medium ${result.fire_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {result.fire_count > 0 ? `Detected (${result.fire_count})` : "None"}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Smoke Detection:</span>
                <span className={`font-medium ${result.smoke_count > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {result.smoke_count > 0 ? `Detected (${result.smoke_count})` : "None"}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Crowd Density:</span>
                <span className={`font-medium ${result.crowd_density > 0.7 ? 'text-red-600' : result.crowd_density > 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {Math.round(result.crowd_density * 100)}%
                </span>
              </li>
              <li className="flex justify-between">
                <span>Location:</span>
                <span>{result.location}</span>
              </li>
              <li className="flex justify-between">
                <span>Alert Status:</span>
                <span className={`font-bold ${result.alertType === "Fire" ? 'text-red-600' : result.alertType === "Crowd" ? 'text-yellow-600' : 'text-green-600'}`}>
                  {result.alertType}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Last Analyzed:</span>
                <span>{lastAnalysisTime ? lastAnalysisTime.toLocaleTimeString() : "Never"}</span>
              </li>
            </ul>
          </div>

          <div className="border p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Threat Assessment</h2>
            <div className="bg-gray-50 p-3 rounded border min-h-[200px] whitespace-pre-wrap font-sans">
              {showAIResult ? threatAnalysis : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-gray-500">
                    {loading ? "Analyzing threats..." : "Analysis ready"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Annotated Images */}
        {(result.annotated_img_base64 || result.crowd_annotated_img_base64) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.annotated_img_base64 && (
              <div className="border p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
                <img
                  src={`data:image/jpeg;base64,${result.annotated_img_base64}`}
                  alt="Detection results"
                  className="max-h-96 mx-auto rounded-lg border"
                />
              </div>
            )}
            {result.crowd_annotated_img_base64 && (
              <div className="border p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Crowd Analysis</h2>
                <img
                  src={`data:image/jpeg;base64,${result.crowd_annotated_img_base64}`}
                  alt="Crowd analysis results"
                  className="max-h-96 mx-auto rounded-lg border"
                />
              </div>
            )}
          </div>
        )}

        {/* Incident History Table with Scroll and Sticky Header */}
        <div className="border p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-xl font-semibold mb-2">Incident History</h2>
          <div className="max-h-64 overflow-y-auto rounded border">
            <table className="min-w-full text-xs table-auto">
              <thead className="sticky top-0 bg-white z-10 shadow">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Time</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Fire</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Smoke</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Crowd</th>
                  <th className="px-3 py-2 text-left font-bold text-gray-700">Location</th>
                </tr>
              </thead>
              <tbody>
                {incidentLog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">No incidents yet</td>
                  </tr>
                ) : (
                  incidentLog.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${idx % 2 === 0 ? 'bg-gray-100' : 'bg-white'} hover:bg-blue-50 transition`}
                    >
                      <td className="px-3 py-2">{item.timestamp && new Date(item.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 py-2">{item.fire_count}</td>
                      <td className="px-3 py-2">{item.smoke_count}</td>
                      <td className="px-3 py-2">{Math.round(item.crowd_density * 100)}%</td>
                      <td className="px-3 py-2">{item.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-96 flex flex-col gap-6">
        {/* Incident Location Map */}
        <div className="border p-4 rounded-lg shadow-md bg-white overflow-hidden">
          <h2 className="text-xl font-semibold mb-2">Incident Location Map</h2>
          <div style={{ borderRadius: 16, overflow: "hidden", minHeight: 250 }}>
            <MapContainer center={mapPosition} zoom={18} style={{ height: 250, width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {isExtremeDanger ? (
                <>
                  <Circle
                    center={DEFAULT_POSITION}
                    radius={30}
                    pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.5 }}
                  />
                  <Marker position={DEFAULT_POSITION} icon={DangerIcon}>
                    <Popup>
                      <span className="text-red-700 font-bold">🚨 Extreme Danger: E Block (Fire Detected)</span>
                    </Popup>
                  </Marker>
                </>
              ) : (
                <Marker position={mapPosition}>
                  <Popup>Incident location: {result.location}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="border p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Emergency Contacts</h2>
          <ul>
            <li>Fire Dept: <a className="text-blue-600" href="tel:101">101</a></li>
            <li>Police: <a className="text-blue-600" href="tel:100">100</a></li>
            <li>Facility Support: <a className="text-blue-600" href="tel:1800123456">1800-123-456</a></li>
          </ul>
        </div>

        {/* User / Building Info */}
        <div className="border p-4 rounded-lg shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Operator</h2>
          <span><b>Name:</b> {user?.name || "Security Staff"}</span>
          <span><b>Building:</b> {buildingInfo?.name || "VNRVJIET"}</span>
        </div>
      </div>
    </div>
  );
};

export default SurveillanceDashboard;
