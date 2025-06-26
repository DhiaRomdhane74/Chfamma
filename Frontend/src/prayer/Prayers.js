import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Prayers.css';

const statesCoordinates = {
  "Tunis": [36.806492, 10.181553],
  "Sfax": [34.739869, 10.760033],
  "Sousse": [35.824519, 10.634576],
  "Kairouan": [35.671139, 10.100556],
  "Bizerte": [37.276770, 9.864155],
  "Gabès": [33.888067, 10.097527],
  "Ariana": [36.98, 10.164719],
  "Kasserine": [35.172261, 8.830760],
  "Gafsa": [34.431129, 8.775656],
  "Zarzis": [33.504093, 11.088143],
  "Monastir": [35.764248, 10.811310],
  "Tataouine": [32.921080, 10.450898],
  "Médenine": [33.339918, 10.495881],
  "Béja": [36.733317, 9.184379],
  "Nabeul": [36.451286, 10.735675],
  "Hammamet": [36.407252, 10.622490],
  "Jendouba": [36.507224, 8.775671],
  "Le Kef": [36.167962, 8.709592],
  "Hammam Lif": [36.723070, 10.344200],
  "Mahdia": [35.502443, 11.045736],
  "Sidi Bouzid": [35.035437, 9.483964],
  "Tozeur": [33.918532, 8.122942],
  "Siliana": [36.088718, 9.364547],
  "Kébili": [33.707154, 8.971473],
};

const mosqueIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + '/mosque.svg',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
  className: 'custom-mosque-icon'
});

export default function Prayers() {
  const mapRef = useRef();
  const [geojson, setGeojson] = useState(null);
  const [prayerData, setPrayerData] = useState([]);
  const [activeView, setActiveView] = useState("map");
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/TN-countries.geojson')
      .then(res => res.json())
      .then(data => setGeojson(data));
  }, []);

  useEffect(() => {
    fetch('https://chfamma.onrender.com/scrape_prayers')
      .then(res => res.json())
      .then(data => setPrayerData(data.prayers || []))
      .catch(() => setPrayerData([]));
  }, []);

  useEffect(() => {
    if (activeView === "map" && mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 350);
    }
  }, [activeView]);

  const tableHeaders = ["City", "Fejr", "Subh", "Dhuhr", "Asser", "Maghreb", "Icha"];

  return (
    <div className="prayers-section">
      
      {isSmallScreen && (
        <div className="prayers-switch-buttons">
          <button
            className={activeView === "map" ? "active" : ""}
            onClick={() => setActiveView("map")}
          >
            Map
          </button>
          <button
            className={activeView === "table" ? "active" : ""}
            onClick={() => setActiveView("table")}
          >
            Table
          </button>
        </div>
      )}

      
      {(!isSmallScreen || activeView === "map") && (
        <div className="prayers-map">
          <MapContainer
            center={[34.0, 9.0]}
            zoom={8}
            style={{ height: "100%", width: "100%", borderRadius: "16px" }}
            whenCreated={mapInstance => { mapRef.current = mapInstance }}
            zoomControl={false}
            dragging={true}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            {geojson && (
              <GeoJSON data={geojson} style={{
                fillColor: 'rgba(0,128,0,0.14)',
                color: 'green',
                weight: 2,
                fillOpacity: 0.3
              }} />
            )}
            {Object.entries(statesCoordinates).map(([city, coords], index) => {
              const data = prayerData.find(row => row.Ville.toLowerCase() === city.toLowerCase());
              return (
                <Marker key={index} position={coords} icon={mosqueIcon}>
                  <Popup>
                    <div>
                      <strong>{city}</strong><br />
                      {data ? (
                        <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                          <li>Fejr: {data.Fejr}</li>
                          <li>Subh: {data.Sunrise}</li>
                          <li>Dhuhr: {data.Dhuhr}</li>
                          <li>Asser: {data.Asser}</li>
                          <li>Maghreb: {data.Maghreb}</li>
                          <li>Icha: {data.Icha}</li>
                        </ul>
                      ) : (
                        <em>No data</em>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      
      {(!isSmallScreen || activeView === "table") && (
        <div className="prayers-table">
          <h2>Prayer Times</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {tableHeaders.map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prayerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No data</td>
                  </tr>
                ) : (
                  prayerData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.Ville}</td>
                      <td>{row.Fejr}</td>
                      <td>{row.Sunrise}</td>
                      <td>{row.Dhuhr}</td>
                      <td>{row.Asser}</td>
                      <td>{row.Maghreb}</td>
                      <td>{row.Icha}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
