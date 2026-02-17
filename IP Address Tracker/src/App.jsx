import { useState, useEffect , useRef} from "react";
import "../src/index.css";
import "leaflet/dist/leaflet.css";
import "./leaflet-icon-fix";
import "leaflet/dist/leaflet.css";
function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="14">
      <path fill="none" stroke="#FFF" strokeWidth="3" d="M2 1l6 6-6 6" />
    </svg>
  );
}

// --- Sub-Components ---

function SearchBar({ onSearch }) {
  const [inputVal, setInputVal] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        placeholder="Search for any IP address or domain"
        className="search-input"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />
      <button type="submit" className="search-btn">
        <ArrowIcon />
      </button>
    </form>
  );
}

function InfoCard({ ip, location, timezone, isp, loading }) {
  return (
    <div className="info-card-container">
      <div className="info-item">
        <span className="info-label">IP Address</span>
        <div className="info-value">{loading ? "..." : ip}</div>
      </div>
      <div className="info-item">
        <span className="info-label">Location</span>
        <div className="info-value">{loading ? "..." : location}</div>
      </div>
      <div className="info-item">
        <span className="info-label">Timezone</span>
        <div className="info-value">{loading ? "..." : timezone}</div>
      </div>
      <div className="info-item">
        <span className="info-label">ISP</span>
        <div className="info-value">{loading ? "..." : isp}</div>
      </div>
    </div>
  );
}

function Header({ children }) {
  return (
    <header className="header">
      <h1>IP Address Tracker</h1>
      {children}
    </header>
  );
}

// NOTE: Since 'react-leaflet' is not pre-installed in this environment,
// we use a custom Component that loads Leaflet from CDN.
// In your local project, you can use the <MapContainer> code I provided earlier.
function MapComponent({ lat, lng, location, isp }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Map Logic
    const initMap = () => {
      if (!window.L || mapInstanceRef.current || !mapContainerRef.current)
        return;

      const L = window.L;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        center: [lat, lng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Custom Icon
      const customIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`<b>${location}</b><br>${isp}`).openPopup();

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Fix render size
      setTimeout(() => map.invalidateSize(), 100);
    };

    // 2. Load Scripts from CDN
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isp, lat ,lng ,location]);

  // 3. Update Map when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      mapInstanceRef.current.flyTo([lat, lng], 13, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.bindPopup(`<b>${location}</b><br>${isp}`).openPopup();
      }
    }
  }, [lat, lng, location, isp]);

  return <div ref={mapContainerRef} className="map-wrapper" />;
}

// --- Main Root Component ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    ip: "8.8.8.8",
    location: "Mountain View, California 94035",
    timezone: "-07:00",
    isp: "Google LLC",
    lat: 37.386,
    lng: -122.083,
  });

  // Helper: Check if input is IP
  function isIP(str) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      str,
    );
  }

  // Helper: Extract domain
  function getDomain(url) {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }

  // Main Logic
  async function fetchIPData(query = "") {
    setLoading(true);
    setError(null);

    try {
      let ipToFetch = "";

      if (!query) {
        // Empty query implies fetching user's IP
        ipToFetch = "";
      } else if (isIP(query)) {
        ipToFetch = query;
      } else {
        // Resolve Domain to IP
        const domain = getDomain(query);
        const dnsRes = await fetch(
          `https://dns.google/resolve?name=${domain}&type=A`,
        );
        const dnsData = await dnsRes.json();

        if (dnsData.Answer && dnsData.Answer.length > 0) {
          ipToFetch = dnsData.Answer.find((record) => record.type === 1)?.data;
        }

        if (!ipToFetch) {
          throw new Error("Could not resolve domain to an IP.");
        }
      }

      // Fetch Geo Data
      // Fix: Ensure we don't send a double slash (e.g., ipinfo.io//json)
      const url = ipToFetch
        ? `https://ipinfo.io/${ipToFetch}/json`
        : `https://ipinfo.io/json`;

      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch location data");
      const result = await res.json();

      if (result.error) throw new Error(result.error.message || "API Error");

      const [latStr, lngStr] = result.loc ? result.loc.split(",") : [0, 0];

      setData({
        ip: result.ip,
        location: `${result.city}, ${result.region} ${result.postal || ""}`,
        timezone: result.timezone || "UTC",
        isp: result.org || "N/A",
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to find location.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(function initialLoad() {
    fetchIPData();
  }, []);

  return (
    <div className="app-container">
      {/* Inject styles */}
      

      <Header>
        <SearchBar onSearch={fetchIPData} />
        {error && <div className="error-msg">{error}</div>}
      </Header>

      <InfoCard
        ip={data.ip}
        location={data.location}
        timezone={data.timezone}
        isp={data.isp}
        loading={loading}
      />

      <MapComponent
        lat={data.lat}
        lng={data.lng}
        location={data.location}
        isp={data.isp}
      />
    </div>
  );
}