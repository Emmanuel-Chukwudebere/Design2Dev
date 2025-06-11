// src/ui/features/WelcomeScreen.tsx
import React, { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { designSystems } from '../../plugin/systems';
import { SupportedDesignSystem } from '../../shared/types';

export function WelcomeScreen() {
  const { setStage } = useStore();
  const [selectedSystem, setSelectedSystem] = useState<SupportedDesignSystem>('React Native Paper');

  const handleAnalyzeClick = () => {
    setStage('analyzing');
    postToFigma('ANALYZE_SCREENS', { designSystem: selectedSystem });
  };

  const handleDesignSystemChange = (system: SupportedDesignSystem) => {
    setSelectedSystem(system);
  };

  return (
    <div className="section">
      <div className="welcome-content">
        <h2 className="welcome-title">Welcome to Design2Dev</h2>
        <p className="welcome-description">
          Transform your Figma designs into production-ready React Native code in minutes.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <div className="feature-text">
              <h3>Smart Component Detection</h3>
              <p>Automatically identifies reusable components and their variants</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🎨</div>
            <div className="feature-text">
              <h3>Design System Integration</h3>
              <p>Seamlessly maps to popular React Native UI libraries</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>Instant Code Generation</h3>
              <p>Get production-ready React Native components instantly</p>
            </div>
          </div>
        </div>

        <div className="design-system-section">
          <div className="section-title">Choose Your Design System</div>
          <div className="design-system-selector">
            {Object.values(designSystems).map((system: import('../../shared/types').DesignSystem) => (
              <label 
                key={system.name}
                className={`design-system-option ${selectedSystem === system.name ? 'selected' : ''}`}
              >
                <input 
                  type="radio" 
                  name="designSystem" 
                  value={system.name}
                  checked={selectedSystem === system.name}
                  onChange={() => handleDesignSystemChange(system.name as import('../../shared/types').SupportedDesignSystem)}
                />
                <div className="design-system-info">
                  <div className="design-system-name">{system.name}</div>
                  <div className="design-system-desc">{system.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="action-section">
          <p className="action-hint">Select up to 5 screens in Figma to begin</p>
          <Button onClick={handleAnalyzeClick}>
            Start Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}