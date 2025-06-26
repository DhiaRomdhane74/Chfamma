import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, GeoJSON, Popup, Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Sports.css';


const teams_stadiums_locs = {
  'Olympique Beja': [36.583101, 9.377242],
  'Zarzis': [33.451539, 11.076929],
  'Metlaoui': [34.43, 8.4],
  'Tataouine': [32.960499, 10.470989],
  'Club Africain': [36.7, 10.272865],
  'Stade Tunisien': [36.5, 10.25],
  'Js Omrane': [36.829019, 10.170118],
  'Es Tunis': [36.7, 10.272865],
  'Gabes': [33.847956, 10.099430],
  'Soliman': [36.71, 10.75],
  'Egs Gafsa': [34.435177, 9.1],
  'Bizertin': [37.1, 9.6],
  'Etoile Sahel': [35.823670, 10.612751],
  'Ben Guerdane': [33.152800, 11.206277],
  'Monastir': [35.336493, 10.819967],
  'Cs Sfaxien': [34.733881, 10.480000]
};


const teamLogos = {
  'Olympique Beja': 'logos/Olympique Beja.png',
  'Zarzis': 'logos/Zarzis.png',
  'Metlaoui': 'logos/Metlaoui.png',
  'Tataouine': 'logos/US Tataouine.png',
  'Club Africain': 'logos/Club Africain.png',
  'Stade Tunisien': 'logos/Stade Tunisien.png',
  'Js Omrane': 'logos/Jeunesse Sportive.png',
  'Es Tunis': 'logos/Esperance Tunis.png',
  'Gabes': 'logos/Gabes.png',
  'Soliman': 'logos/Soliman.png',
  'Egs Gafsa': 'logos/Gafsa.png',
  'Bizertin': 'logos/CA Bizertin.png',
  'Etoile Sahel': 'logos/Etoile Sahel.png',
  'Ben Guerdane': 'logos/Ben Guerdane.png',
  'Monastir': 'logos/Monastir.png',
  'Cs Sfaxien': 'logos/CS Sfaxien.png'
};


function getRoundName(roundNumber) {
  if (roundNumber === 1) return '1re journée';
  return `${roundNumber}e journée`;
}


function createMatchIcon(homeTeam, awayTeam) {
  const homeLogo = teamLogos[homeTeam] || 'logos/placeholder.png';
  const awayLogo = teamLogos[awayTeam] || 'logos/placeholder.png';
  const html = `
    <div style="display: flex; align-items: center; padding: 0;">
      <img src="${homeLogo}" alt="${homeTeam}" style="width:28px; height:22px; object-fit:contain; margin-right:6px;" />
      <span style="font-weight:700; color:black; margin:0 6px;">vs</span>
      <img src="${awayLogo}" alt="${awayTeam}" style="width:28px; height:22px; object-fit:contain; margin-left:6px;" />
    </div>
  `;
  return new DivIcon({
    html,
    className: '',
    iconAnchor: [40, 22]
  });
}


function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

export default function Sports() {
  const [geojson, setGeojson] = useState(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [matches, setMatches] = useState(Array(8).fill({}));
  const [view, setView] = useState('results'); // 'results' or 'news'
  const [news, setNews] = useState([]);
  const [activeView, setActiveView] = useState("map");
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);
  const mapRef = useRef();

 
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
    async function fetchMatchesForRound(roundNumber) {
      try {
        const response = await fetch('http://127.0.0.1:8001/matches_calendar');
        const data = await response.json();
        const roundName = getRoundName(roundNumber);
        const roundMatches = (data.matches || []).filter(m => m.round === roundName);

        const paddedMatches = [
          ...roundMatches.slice(0, 8),
          ...Array(Math.max(0, 8 - roundMatches.length)).fill({
            home_team: '',
            away_team: '',
            match_time: '',
            stadium: ''
          })
        ];
        setMatches(paddedMatches);
      } catch {
        setMatches(Array(8).fill({
          home_team: '',
          away_team: '',
          match_time: '',
          stadium: ''
        }));
      }
    }
    if (view === 'results') {
      fetchMatchesForRound(selectedRound);
    }
  }, [selectedRound, view]);

  
  const fetchNews = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/scrape_sport_news');
      const data = await response.json();
      setNews(data.news || []);
    } catch {
      setNews([]);
    }
  };

  useEffect(() => {
    if (view === 'news' && news.length === 0) {
      fetchNews();
    }
    
  }, [view]);

  return (
    <div className="sports-section">
      
      {isSmallScreen && (
        <div className="sports-switch-buttons">
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
        <div className="sports-map">
          <MapContainer
            center={[34.0, 9.0]}
            zoom={8}
            style={{ minHeight: "150px", height: "100%", width: "100%", borderRadius: "16px" }}
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
            {matches.map((match, idx) => {
              const homeLoc = teams_stadiums_locs[match.home_team];
              if (!homeLoc || !match.home_team || !match.away_team) return null;
              return (
                <Marker
                  key={idx}
                  position={homeLoc}
                  icon={createMatchIcon(match.home_team, match.away_team)}
                  interactive={true}
                >
                  <Popup>
                    <div style={{textAlign: 'center', minWidth: 170}}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
                        <img
                          src={teamLogos[match.home_team] || 'logos/placeholder.png'}
                          alt={match.home_team}
                          style={{ width: 32, height: 26, objectFit: 'contain', marginRight: 4, verticalAlign: 'middle' }}
                        />
                        <span style={{ fontWeight: 600 }}>{match.home_team}</span>
                        <span style={{ color: '#888', margin: '0 4px', fontWeight: 700 }}>vs</span>
                        <span style={{ fontWeight: 600 }}>{match.away_team}</span>
                        <img
                          src={teamLogos[match.away_team] || 'logos/placeholder.png'}
                          alt={match.away_team}
                          style={{ width: 32, height: 26, objectFit: 'contain', marginLeft: 4, verticalAlign: 'middle' }}
                        />
                      </div>
                      <div>
                        <div><strong>Date:</strong> {match.match_time || '-'}</div>
                        <div><strong>Stadium:</strong> {match.stadium || '-'}</div>
                        <div><strong>Surface:</strong> {match.surface || '-'}</div>
                        <div><strong>Capacity:</strong> {match.capacity || '-'}</div>
                        <div><strong>Round:</strong> {match.round || '-'}</div>
                        <div>
                          <strong>Score:</strong>
                          {" "}
                          {typeof match.home_score === "number" && typeof match.away_score === "number"
                            ? `${match.home_score} - ${match.away_score}`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      
      {(!isSmallScreen || activeView === "table") && (
        <div className="sports-table">
          <div className="sports-tabs">
            <button
              className={view === 'results' ? 'tab-active' : ''}
              onClick={() => setView('results')}
            >
              Results
            </button>
            <button
              className={view === 'news' ? 'tab-active' : ''}
              onClick={() => setView('news')}
            >
              News
            </button>
          </div>
          {view === 'results' ? (
            <>
              <div className="round-selector">
                <select
                  id="round-select"
                  value={selectedRound}
                  onChange={e => setSelectedRound(Number(e.target.value))}
                >
                  {[...Array(30)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Round {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="table-scroll">
                <table>
                  <tbody>
                    {matches.map((match, idx) => (
                      <tr key={idx}>
                        <td colSpan={4} style={{ textAlign: 'center' }}>
                          
                          {match.home_team && (
                            <img
                              src={teamLogos[match.home_team] || 'logos/placeholder.png'}
                              alt={match.home_team}
                              style={{
                                width: 40,
                                height: 32,
                                verticalAlign: 'middle',
                                marginRight: 8,
                                objectFit: 'contain'
                              }}
                              onError={e => (e.target.src = 'logos/placeholder.png')}
                            />
                          )}
                         
                          <span style={{ fontWeight: 500, marginRight: 6 }}>{match.home_team}</span>
                          
                          <span style={{ color: '#888', margin: '0 8px' }}>vs</span>
                          
                          <span style={{ fontWeight: 500, marginLeft: 6 }}>{match.away_team}</span>
                          
                          {match.away_team && (
                            <img
                              src={teamLogos[match.away_team] || 'logos/placeholder.png'}
                              alt={match.away_team}
                              style={{
                                width: 40,
                                height: 32,
                                verticalAlign: 'middle',
                                marginLeft: 8,
                                objectFit: 'contain'
                              }}
                              onError={e => (e.target.src = 'logos/placeholder.png')}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="news-list">
              {news.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>
                  No news available.
                </div>
              ) : (
                news.map((n, i) => {
                  const rtl = isArabic((n.title || "") + " " + (n.description || ""));
                  return (
                    <div
                      key={i}
                      style={{
                        background: '#f9f9f9',
                        borderRadius: '12px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        margin: '1rem 0',
                        padding: '1.2rem 1rem',
                        textAlign: rtl ? 'right' : 'left',
                        direction: rtl ? 'rtl' : 'ltr'
                      }}
                    >
                      <div className="news-title">
                        {n.title}
                      </div>
                      <div className="news-desc">
                        {n.description}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
