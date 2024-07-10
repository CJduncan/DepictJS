import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/generator');
  };

  return (
    <div className="landing-page">
      <header className="hero">
        <h1>UI Flow Generator</h1>
        <p className="tagline">Visualize Your Code Structure in Seconds</p>
        <button onClick={handleGetStarted} className="cta-button">Get Started</button>
      </header>

      <section className="features">
        <h2>Streamline Your Development Process</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <i className="feature-icon">📊</i>
            <h3>Instant Visualization</h3>
            <p>Transform your codebase into an interactive graph with a single click.</p>
          </div>
          <div className="feature-item">
            <i className="feature-icon">🔍</i>
            <h3>Deep Insights</h3>
            <p>Gain a clear understanding of your project's structure and dependencies.</p>
          </div>
          <div className="feature-item">
            <i className="feature-icon">🚀</i>
            <h3>Boost Productivity</h3>
            <p>Quickly navigate complex codebases and identify optimization opportunities.</p>
          </div>
          <div className="feature-item">
            <i className="feature-icon">🤝</i>
            <h3>Enhance Collaboration</h3>
            <p>Improve team communication with clear visual representations of your code.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Upload your project folder</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p>Our algorithm analyzes your code structure</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p>View and interact with your generated UI flow</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Optimize Your Workflow?</h2>
        <p>Join developers who are visualizing their code like never before.</p>
        <button onClick={handleGetStarted} className="cta-button">Start Generating Your UI Flow</button>
      </section>
    </div>
  );
};

export default LandingPage;