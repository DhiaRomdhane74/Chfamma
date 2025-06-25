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
 //"La Goulette": [36.820010, 10.302084],
  "Zarzis": [33.504093, 11.088143],
 // "Ben Arous": [36.743498, 10.231998],
  "Monastir": [35.764248, 10.811310],
 // "La Mohammedia": [36.675557, 10.153501],
 // "La Marsa": [36.889114, 10.322283],
 // "M'saken": [35.732789, 10.575149],
  
 // "Houmt Souk": [33.875959, 10.857284],
  "Tataouine": [32.921080, 10.450898],
 // "El Hamma": [33.885913, 9.795092],
  "Médenine": [33.339918, 10.495881],
  "Béja": [36.733317, 9.184379],
  "Nabeul": [36.451286, 10.735675],
  "Hammamet": [36.407252, 10.622490],
  "Jendouba": [36.507224, 8.775671],
  "Le Kef": [36.167962, 8.709592],
  "Hammam Lif": [36.723070, 10.344200],
  //"Oued Lill": [36.842685, 10.038786],
  //"Menzel Bourguiba": [37.143244, 9.784622],
  "Mahdia": [35.502443, 11.045736],
  //"Zouila": [35.506407, 11.057755],
  //"Radès": [36.771597, 10.276853],
 // "Kelibia": [36.846156, 11.099480],
  "Sidi Bouzid": [35.035437, 9.483964],
  //"Metlaoui": [34.319365, 8.407509],
  //"Djemmal": [35.624497, 10.758628],
  //"Ksar Hellal": [35.645256, 10.873408],
  "Tozeur": [33.918532, 8.122942],
  
  //"Hammam Sousse": [35.886398, 10.591527],
  //"Gremda": [34.790573, 10.715438],
 // "Korba": [36.580605, 10.862091],
 // "La Sebala du Mornag": [36.685098, 10.286415],
 // "Midoun": [33.789349, 10.970377],
 // "Mateur": [37.038869, 9.663968],
 // "Ar Rudayyif": [34.385681, 8.161185],
 // "Douz": [33.461433, 9.029480],
 // "Ksour Essef": [35.417569, 10.997685],
  "Siliana": [36.088718, 9.364547],
  
 // "Nefta": [33.876153, 7.878638],
 // "La Chebba": [35.233688, 11.110800],
  
 // "Takilsa": [36.792337, 10.629525],
 // "Medjez el Bab": [36.648408, 9.614671],
 // "El Jem": [35.292333, 10.704164],
 // "Akouda": [35.874671, 10.571821],
  "Kébili": [33.707154, 8.971473],
  //"Tajerouine": [35.890417, 8.552893],
  
 // "Ouardenine": [35.708707, 10.678813],
 // "El Fahs": [36.377799, 9.910210],
  
  //"Zaghouan": [36.409116, 10.142331],
 // "Menzel Bou Zelfa": [36.684039, 10.583840],
 // "El Alia": [37.171905, 10.026851],
  //"Thala": [35.583038, 8.667203],
  //"Bekalta": [35.620646, 10.994838],
  
  
  //"Galaat el Andeless": [37.061825, 10.119889],
  
 // "Fondouk Djedid": [36.648336, 10.445286],
  //"Rafraf": [37.190706, 10.190371],
  //"Bou Salem": [36.610305, 8.974241],
  
  //"Bir Ali Ben Khlifa": [34.735369, 10.086344],
  //"Djerba Midun": [33.821901, 10.997494]
};

// Red marker icon
const mosqueIcon = new L.Icon({
  iconUrl: process.env.PUBLIC_URL + '/mosque.svg',
  iconSize: [35, 35],       // Adjust size as needed
  iconAnchor: [17, 35],     // Center-bottom anchor
  popupAnchor: [0, -30],    // Popup position relative to icon
  className: 'custom-mosque-icon'
});


export default function Prayers() {
  const mapRef = useRef();
  const [geojson, setGeojson] = useState(null);
  const [prayerData, setPrayerData] = useState([]);

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

  const tableHeaders = ["City", "Fejr", "Subh", "Dhuhr", "Asser", "Maghreb", "Icha"];

  return (
    <div className="prayers-section" style={{ display: 'flex', gap: '2rem', padding: '2rem', background: '#e8e8e8', height: '100vh' }}>
      {/* MAP */}
      <div className="prayers-map" style={{
        flex: 1.2,
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        background: '#fff'
      }}>
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

      {/* TABLE */}
      <div className="prayers-table" style={{
        flex: 1,
        background: '#fff',
        borderRadius: 16,
        padding: '2rem 1.5rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        minWidth: 350,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ margin: 0, marginBottom: '1.4rem', fontSize: '2rem' }}>Prayer Times</h2>
        <div className="table-scroll" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {tableHeaders.map(h => (
                  <th key={h} style={{
                    padding: '0.6rem 0.8rem',
                    background: '#f8f8f8',
                    fontWeight: 600,
                    minWidth: h === "City" ? 130 : undefined,
                    width: h === "City" ? 170 : undefined
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prayerData.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No data</td></tr>
              ) : (
                prayerData.map((row, i) => (
                  <tr key={i} style={{ background: '#f9f9f9', borderRadius: 12 }}>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 500, minWidth: 130, width: 170 }}>{row.Ville}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Fejr}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Sunrise}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Dhuhr}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Asser}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Maghreb}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{row.Icha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
