import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UIFlowGenerator from './UIFlowGenerator';
import AboutSection from './AboutSection';
import LandingPage from './LandingPage';



const App = () => {
  return (
    <Router>
      <div className="app-container">
        <nav className="top-nav">
          <Link to="/" className="logo">UI Flow Generator</Link>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/generator">Generator</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/generator" element={<UIFlowGenerator />} />
            <Route path="/about" element={<AboutSection />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; 2023 UI Flow Generator. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;