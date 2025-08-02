import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const ALERT_COOLDOWN = 30000; // 30 seconds cooldown between same-type alerts

const SurveillanceDashboard = () => {
  // State management
  const [result, setResult] = useState({
    fire_count: 0,
    smoke_count: 0,
    crowd_density: 0,
    location: "Unknown",
    alertType: "None",
    annotated_img_base64: null
  });
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(50);
  const [threatAnalysis, setThreatAnalysis] = useState("Waiting for first analysis...");
  const [lastAlertTime, setLastAlertTime] = useState({});
  
  // Refs for video handling
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisTimerRef = useRef(null);

  // Camera control functions
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
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
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    stopAutoAnalysis();
  };

  // Image capture function
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

  // Threat analysis and alerting
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

    const summary = threats.map(t => (
      `${t.level} RISK: ${t.message}\nACTIONS: ${t.actions.join(", ")}`
    )).join("\n\n");

    const highestRisk = threats.some(t => t.level === "CRITICAL") ? "Fire" :
                       threats.some(t => t.level === "HIGH") ? "Crowd" : "Monitor";

    return {
      summary: `🚨 THREAT DETECTED 🚨\n\n${summary}\n\nImmediate attention required.`,
      alertType: highestRisk === "Fire" ? "Fire" : 
                highestRisk === "Crowd" ? "Crowd" : "None"
    };
  };

  const alertOfficials = (alertType, location) => {
    const now = Date.now();
    const lastAlert = lastAlertTime[alertType] || 0;
    
    // Check if cooldown period has passed for this alert type
    if (now - lastAlert < ALERT_COOLDOWN) {
      console.log(`Alert ${alertType} skipped (cooldown active)`);
      return;
    }

    const alertMap = {
      Fire: {
        recipients: ["fire_department@example.com", "security@example.com", "medical@example.com"],
        message: `URGENT: Fire detected at ${location}. Immediate response required.`
      },
      Crowd: {
        recipients: ["security@example.com", "operations@example.com"],
        message: `Crowd congestion at ${location} (${Math.round(result.crowd_density * 100)}% density).`
      }
    };

    if (alertMap[alertType]) {
      // In production, integrate with your alert system (email API, SMS, etc.)
      console.log(`Alerting ${alertMap[alertType].recipients.join(", ")}: ${alertMap[alertType].message}`);
      toast.success(`${alertType} alert dispatched`);
      
      // Update last alert time for this type
      setLastAlertTime(prev => ({
        ...prev,
        [alertType]: now
      }));
    }
  };

  // Main analysis function
  const handleAnalyze = async () => {
    if (!isCameraActive) return toast.error("Activate camera first");
    if (loading) return;

    const imageData = captureImage();
    if (!imageData) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/incident/detect", { image: imageData });
      const { summary, alertType } = generateThreatSummary(res.data);
      
      setResult({
        ...res.data,
        alertType: alertType || "None"
      });
      setThreatAnalysis(summary);
      
      if (alertType && alertType !== "None") {
        alertOfficials(alertType, res.data.location);
      }

    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Auto-analysis functions
  const startAutoAnalysis = () => {
    if (!isCameraActive) return;
    setAutoAnalyze(true);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAutoAnalysis();
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Surveillance Threat Monitor</h1>

      {/* Camera Control Section */}
      <div className="border p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded-md ${
              isCameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isCameraActive ? "Stop Camera" : "Start Camera"}
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={!isCameraActive || loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Frame"}
          </button>

          <button
            onClick={toggleAutoAnalyze}
            disabled={!isCameraActive}
            className={`px-4 py-2 rounded-md ${
              autoAnalyze ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white disabled:opacity-50`}
          >
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
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setAnalysisInterval(isNaN(val) ? 2000 : Math.max(500, val));
            }}
            min="500"
            step="100"
            className="border p-1 rounded w-24"
            disabled={autoAnalyze}
          />
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incident Details */}
            <div className="border p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Incident Details</h2>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Fire Detection:</span>
                  <span className={`font-medium ${
                    result.fire_count > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {result.fire_count > 0 ? `Detected (${result.fire_count})` : "None"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Smoke Detection:</span>
                  <span className={`font-medium ${
                    result.smoke_count > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {result.smoke_count > 0 ? `Detected (${result.smoke_count})` : "None"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Crowd Density:</span>
                  <span className={`font-medium ${
                    result.crowd_density > 0.7 ? 'text-red-600' : 
                    result.crowd_density > 0.4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {Math.round(result.crowd_density * 100)}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Location:</span>
                  <span>{result.location}</span>
                </li>
                <li className="flex justify-between">
                  <span>Alert Status:</span>
                  <span className={`font-bold ${
                    result.alertType === "Fire" ? 'text-red-600' :
                    result.alertType === "Crowd" ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {result.alertType}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Last Analyzed:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </li>
              </ul>
            </div>

            {/* Threat Analysis */}
            <div className="border p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Threat Assessment</h2>
              <div className="bg-gray-50 p-3 rounded border min-h-[200px]">
                <pre className="whitespace-pre-wrap font-sans">{threatAnalysis}</pre>
              </div>
            </div>
          </div>

          {/* Annotated Image */}
          {result.annotated_img_base64 && (
            <div className="border p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Annotated Image</h2>
              <img
                src={`data:image/jpeg;base64,${result.annotated_img_base64}`}
                alt="Detection results"
                className="max-h-96 mx-auto rounded-lg border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveillanceDashboard;