import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Weather.css';

const govs = [
  "Ariana", "Beja", "Ben Arous", "Bizerte", "Gabes", "Gafsa", 
  "Jendouba", "Kairouan", "Kasserine", "Kebili", "La Manouba", 
  "Tozeur", "Medenine", "Monastir","Mahdia", "Nabeul", "Sfax", 
  "Sidi Bouzid", "Siliana", "Sousse", "Tunis", "Zaghouan", 
  "Tataouine", "Le Kef"
];
const locs = [
  [36.9600, 10.1652], [36.6365, 9.35], [36.6404, 10.20], [37.0737, 9.6642], [33.8, 9.8],
  [34.4178, 8.7762], [36.58, 8.7433], [35.6725, 9.8755], [35.1672, 8.8286], [33.3, 8.9666],
  [36.8065, 9.85], [34, 8.1], [33.3653, 10.8], [35.665, 10.7396], [35.36, 10.7396],
  [36.6512, 10.7463], [34.7406, 10.36], [34.902, 9.5306], [36.1, 9.3713], [35.9290, 10.4088],
  [36.8005, 10.1652], [36.3922, 10], [32.1, 10.1], [36.1, 8.7148]
];

const getWeatherIconName = ({ temp, wind, rainProb, isNight }) => {
  if (rainProb >= 40) return isNight ? "night-rain" : "rain";
  if (rainProb >= 10) return isNight ? "night-cloud" : "cloud-rain";
  if (temp >= 35 && wind >= 25) return "sun-wind";
  if (temp >= 30 && wind >= 25) return "sun-wind";
  if (temp >= 35) return "sun";
  if (temp >= 30) return "sun";
  if (wind >= 40) return "wind";
  if (temp < 10) return "snowflake";
  if (isNight && temp < 10) return "night";
  if (isNight) return "night";
  if (temp >= 18 && temp < 30 && wind >= 15) return "cloudy-sun";
  return "cloud";
};

const frenchToEnglishDesc = desc => {
  if (!desc) return "";
  const map = {
    "Ensoleillé": "Sunny",
    "Légèrement nuageux": "Partly cloudy",
    "Ciel dégagé": "Clear sky",
    "Couvert": "Cloudy",
    "Faibles pluies": "Light rain",
    "Pluie": "Rain",
    "Orages": "Storms",
    "Brume": "Fog",
    "Éclaircies": "Sunny intervals",
    "Averses": "Showers",
    "Nuit claire": "Clear night",
    "Nuit nuageuse": "Cloudy night",
  };
  return map[desc] || desc;
};

export default function Weather() {
  const [temps, setTemps] = useState([]);
  const [geojson, setGeojson] = useState(null);
  const mapRef = useRef();

  
  const [activeView, setActiveView] = useState("map");

  
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:8001/scrape_temperatures')
      .then(res => res.json())
      .then(data => setTemps(data.temperatures || []));
  }, []);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/TN-countries.geojson')
      .then(res => res.json())
      .then(data => setGeojson(data));
  }, []);

  return (
    <div className="weather-section">
      
      {isSmallScreen && (
        <div className="weather-switch-buttons">
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
        <div className="weather-map">
          <MapContainer
            center={[34.0, 9.0]}
            zoom={8}
            style={{ minHeight: "220px", height: "100%", width: "100%", borderRadius: "16px" }}
            whenCreated={mapInstance => { mapRef.current = mapInstance }}
            zoomControl={false}
            dragging={true}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            {geojson && (
              <GeoJSON data={geojson} style={{
                fillColor: 'rgba(0,128,0,0.15)',
                color: 'green',
                weight: 2,
                fillOpacity: 0.4
              }} />
            )}

            {temps.length === govs.length && govs.map((gov, idx) => {
              const temp = temps.find(city =>
                city.city === gov ||
                city.city === gov.replace('La ', '').replace('Le ', '')
              );
              const position = locs[idx];
              const curr = temp?.hourly?.[0];
              const hour = curr ? new Date(curr.time).getHours() : 12;
              const isNight = hour < 6 || hour > 19;

              const iconName = getWeatherIconName({
                temp: curr?.temperature ?? 0,
                wind: curr?.wind_speed ?? 0,
                rainProb: curr?.rain_probability ?? 0,
                isNight
              });

              const customIcon = new L.Icon({
                iconUrl: require(`./weathers/${iconName}.svg`),
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38]
              });

              const now = new Date();
              const remainingHours = (temp?.hourly || []).filter(h => {
                const hDate = new Date(h.time);
                return (
                  hDate.getFullYear() === now.getFullYear() &&
                  hDate.getMonth() === now.getMonth() &&
                  hDate.getDate() === now.getDate() &&
                  hDate.getTime() >= now.getTime()
                );
              });

              return (
                <Marker key={gov} position={position} icon={customIcon}>
                  <Popup>
                    <b>{gov}</b><br />
                    {curr ? (
                      <>
                        <img
                          src={require(`./weathers/${iconName}.svg`)}
                          alt={iconName}
                          style={{ width: 32, verticalAlign: 'middle' }}
                        />{' '}
                        <b>{curr.temperature}°C</b> <span style={{ color: '#888' }}>{frenchToEnglishDesc(curr.description)}</span><br />
                        <span>Feels like: {curr.feels_like ?? "--"}°C<br /></span>
                        <span>Wind: {curr.wind_speed ?? "--"} km/h {curr.wind_cardinal || ""} (Gusts {curr.wind_gust ?? "--"} km/h)<br /></span>
                        <span>Humidity: {curr.humidity ?? "--"}%<br /></span>
                        <span>Pressure: {curr.pressure ?? "--"} hPa<br /></span>
                        <span>Rain: {curr.rain_probability ?? "--"}%<br /></span>
                        <span>UV index: {curr.uv ?? "--"}<br /></span>
                        <span>Air quality: {curr.air_quality ?? "--"}<br /></span>
                        <hr />
                        <b>Remaining hours today:</b>
                        {remainingHours.length === 0 ? (
                          <div style={{color: '#888'}}>No more data for today.</div>
                        ) : (
                          <table style={{ fontSize: "0.9em", marginTop: "2px" }}>
                            <thead>
                              <tr>
                                <th>Time</th>
                                <th>Temp</th>
                                <th>Rain</th>
                                <th>Wind</th>
                              </tr>
                            </thead>
                            <tbody>
                              {remainingHours.map((h, i) => (
                                <tr key={i}>
                                  <td>{new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                                  <td>{h.temperature}°C</td>
                                  <td>{h.rain_probability}%</td>
                                  <td>{h.wind_speed} km/h</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    ) : (
                      <span>No weather data available.</span>
                    )}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {(!isSmallScreen || activeView === "table") && (
        <div className="weather-table">
          <h2>Today's Temperatures</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Governorate</th>
                  <th>Current Temp (°C)</th>
                  <th>Max (°C)</th>
                  <th>Min (°C)</th>
                </tr>
              </thead>
              <tbody>
                {temps.map((city, idx) => {
                  const hourly = city.hourly || [];
                  const curr = hourly.length > 0 ? hourly[0] : null;
                  const allTemps = hourly.map(h => h.temperature).filter(t => typeof t === 'number');
                  const minTemp = allTemps.length > 0 ? Math.min(...allTemps) : "--";
                  const maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : "--";
                  return (
                    <tr key={idx}>
                      <td>{city.city}</td>
                      <td>{curr ? `${curr.temperature} °C` : "--"}</td>
                      <td>{maxTemp} °C</td>
                      <td>{minTemp} °C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
