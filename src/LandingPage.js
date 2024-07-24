import React from 'react';
import { Link } from 'react-router-dom';


const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1>UI Flow Generator</h1>
        <p>Visualize your project structure with ease</p>
      </header>
      <main className="landing-main">
        <section className="feature-section">
          <div className="feature">
            <i className="feature-icon">📊</i>
            <h2>Interactive Visualization</h2>
            <p>Explore your project's structure through an interactive, hierarchical graph.</p>
          </div>
          <div className="feature">
            <i className="feature-icon">🔍</i>
            <h2>Depth Control</h2>
            <p>Adjust the hierarchy level to focus on specific layers of your project.</p>
          </div>
          <div className="feature">
            <i className="feature-icon">🚀</i>
            <h2>Easy to Use</h2>
            <p>Simply drag and drop your project folder to get started.</p>
          </div>
        </section>
        <Link to="/generator" className="cta-button">Get Started</Link>
      </main>
      <footer className="landing-footer">
        <p>&copy; 2024 UI Flow Generator. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;