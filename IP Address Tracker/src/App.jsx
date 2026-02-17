import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { ChevronRight } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./leaflet-icon-fix";

const locationiqKey = "pk.eea95b5b6a9c348ccb93a6889a2ebe55";


export default function App() {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState([31.2001, 29.9187]);
  const [markerText, setMarkerText] = useState("Alexandria");
  const [query , setQuery] = useState("192.XX.XXX.X");
  const [city , setCity] = useState('hi')
  const [location , setLocation] = useState("Nxxx , ZZ")
  const [region , setRegion] = useState("ALX")
  const [timezone , setTimezone] = useState("TZ")
  const [isp , setIsp] = useState("Com.")
  async function handleSearch() {
    if (!search) return;

    const API = `https://us1.locationiq.com/v1/search?key=${locationiqKey}&q=${search}&format=json`;
    const API2 = "http://ip-api.com/json/";

    try {
      const res = await fetch(API);
      const res2 = await fetch(API2);

      if (!res.ok) {
        console.log("API Error:", res.status);
        return;
      }

      const data = await res.json();
      const data2 = await res2.json();
        console.log(data2)
        console.log(data2.query);
        console.log(data2.city);
        console.log(data2.region);
        console.log(data2.timezone);
        console.log(data2.isp);


      console.log(data)
      if (!data || data.length === 0) {
        console.log("No location found");
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      setQuery(data2.query)
      setLocation(data2.region)
      setRegion(data2.region)
      setTimezone(data2.timezone)
      setCity(data2.city)
      setIsp(data2.isp)

      setPosition([lat, lon]);
      setMarkerText(data[0].display_name);
    } catch (err) {
      console.error(err);
    }
  }

    return (
      <>
        <Box
          search={search}
          handelSearch={handleSearch}
          setSearch={setSearch}
        />
        <SearchBox query={query} city={city} region={region} timezone={timezone} isp={isp} />
        <MapBox position={position} markerText={markerText} />
      </>
    );
}

function Box({ search, handelSearch, setSearch }) {
  return (
    <div className="box-title">
      <h1>IP Address Tracker</h1>

      <span className="input-field">
        <input
          className="search-input"
          type="text"
          placeholder="Search for any IP address or domain"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />

        <button className="run" onClick={handelSearch}>
          <ChevronRight />
        </button>
      </span>
    </div>
  );
}

function SearchBox({query , city , region , timezone , isp }) {
  return (
    
      <div className="inner-box">

        <span className="info">
          <p>IP Address</p>
          <h2>{query}</h2>
        </span>

        <span className="info">
          <p>Locaiton</p>
          <h2>{city}, {region}</h2>
        </span>

        <span className="info">
          <p>TIMEZONE</p>
          <h2>{timezone}</h2>
        </span>

        <span className="info">
          <p>ISP</p>
          <h2>{isp}</h2>
        </span>
      </div>

  );
}
function MapBox({ position, markerText }) {
  return (
    <>
      <MapContainer center={position} zoom={15} style={{ height: "600px", width:"100%" , position:"absolute" , transform:"-50% -50%" , left:"0%" ,top:"40%" , zIndex:"-1" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>{markerText}</Popup>
        </Marker>
        <ChangeMapView position={position} />
        //{" "}
      </MapContainer>
    </>
  );
}
function ChangeMapView({ position }) {
  const map = useMap();
  map.setView(position, 15);
  return null;
}
