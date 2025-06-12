// src/ui/features/WelcomeScreen.tsx
import React, { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { designSystems } from '../../plugin/systems';
import { SupportedDesignSystem } from '../../shared/types';

export function WelcomeScreen() {
  const { setStage, pageInfo } = useStore();
  const [selectedSystem, setSelectedSystem] = useState<SupportedDesignSystem>('Custom');

  const handleDesignSystemChange = (system: SupportedDesignSystem) => {
    setSelectedSystem(system);
  };

  const handleAnalyzeClick = () => {
    postToFigma('ANALYZE_SCREENS', { designSystem: selectedSystem });
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1 className="welcome-title">Design2Dev</h1>
        <p className="welcome-description">
          Extract comprehensive specifications from your Figma screens and map them to your chosen design system.
        </p>

        {pageInfo && (
          <div className="page-info">
            <p>Page: {pageInfo.name} ({pageInfo.nodeCount} top-level nodes)</p>
          </div>
        )}

        <div className="page-info">
          <div className="info-title">Selection Requirements</div>
          <ul className="info-list">
            <li>Select 1-8 frames to analyze</li>
            <li>Only top-level frames are supported</li>
            <li>Make sure frames are properly named</li>
          </ul>
        </div>

        <div className="design-system-section">
          <div className="section-title">Choose Your Design System</div>
          <div className="design-system-selector">
            {Object.values(designSystems).map((system) => (
              <label 
                key={system.name}
                className={`design-system-option ${selectedSystem === system.name ? 'selected' : ''}`}
              >
                <input 
                  type="radio" 
                  name="designSystem" 
                  value={system.name}
                  checked={selectedSystem === system.name}
                  onChange={() => handleDesignSystemChange(system.name as SupportedDesignSystem)}
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
          <p className="action-hint">Select frames and click to analyze screens</p>
          <Button onClick={handleAnalyzeClick}>
            Analyze Screens
          </Button>
        </div>
      </div>
    </div>
  );
}