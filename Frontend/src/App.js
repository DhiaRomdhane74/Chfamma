import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './navbar/Navbar';
import Weather from './weather/Weather';
import Sports from './sports/Sports'; // Make sure you have this file!
import Prayers from './prayer/Prayers';
// ...


function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Weather />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/prayer" element={<Prayers />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
