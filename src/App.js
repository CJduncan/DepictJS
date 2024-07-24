import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './LandingPage';
import UIFlowGenerator from './UIFlowGenerator';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/generator">Generator</Link>
        </nav>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/generator" element={<UIFlowGenerator />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;