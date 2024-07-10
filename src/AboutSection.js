import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutSection = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
    navigate('/generator');
    };


    return (
        <div className="about-section">
    <h1>About UI Flow Generator</h1>
    <p className="tagline">Visualize Your Code. Optimize Your Workflow.</p>
    
    <section className="product-description">
      <h2>What is UI Flow Generator?</h2>
      <p>
        UI Flow Generator is a cutting-edge tool designed to revolutionize how developers understand and communicate their project structures. By transforming complex codebases into intuitive, interactive visual graphs, we empower teams to work smarter, faster, and more collaboratively.
      </p>
    </section>
    
    <section className="key-features">
      <h2>Key Features</h2>
      <ul>
        <li><strong>Instant Visualization:</strong> Drag and drop your project folder to generate a comprehensive graph in seconds.</li>
        <li><strong>Interactive Graphs:</strong> Zoom, pan, and click through your project structure with ease.</li>
        <li><strong>Smart Layout:</strong> Our advanced algorithms organize your components hierarchically for optimal readability.</li>
        <li><strong>Cross-Language Support:</strong> From JavaScript to Python, we've got your tech stack covered.</li>
        <li><strong>Export & Share:</strong> Easily export your graphs to share with your team or include in documentation.</li>
      </ul>
    </section>
    
    <section className="benefits">
      <h2>Why Choose UI Flow Generator?</h2>
      <div className="benefit-item">
        <h3>Boost Productivity</h3>
        <p>Quickly grasp project structures, reducing onboarding time for new team members and speeding up development cycles.</p>
      </div>
      <div className="benefit-item">
        <h3>Enhance Collaboration</h3>
        <p>Provide a common visual language for developers, designers, and stakeholders to discuss project architecture.</p>
      </div>
      <div className="benefit-item">
        <h3>Identify Optimizations</h3>
        <p>Visualize dependencies and connections to spot potential optimizations and refactoring opportunities.</p>
      </div>
      <div className="benefit-item">
        <h3>Simplify Complexity</h3>
        <p>Turn thousands of lines of code into clear, understandable visual representations.</p>
      </div>
    </section>
    
    <section className="cta">
        <h2>Ready to Transform Your Development Process?</h2>
        <p>Experience the power of visual project mapping today. Try UI Flow Generator now and see your code in a whole new light!</p>
        <button className="cta-button" onClick={handleGetStarted}>Get Started</button>
    </section>
  </div>
);}


export default AboutSection;