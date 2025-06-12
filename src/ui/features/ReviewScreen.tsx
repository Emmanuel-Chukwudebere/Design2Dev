// src/ui/features/ReviewScreen.tsx
import React, { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';

export function ReviewScreen() {
  const { screenSpecs, setStage } = useStore();
  const [activeTab, setActiveTab] = useState<'screens' | 'export'>('screens');

  const handleExport = () => {
    postToFigma('EXPORT_BUNDLE', { screenSpecs });
  };

  return (
    <div className="review-screen">
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'screens' ? 'active' : ''}`}
          onClick={() => setActiveTab('screens')}
        >
          Screens
        </button>
        <button 
          className={`tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>

      <div className={`result-content ${activeTab === 'screens' ? 'active' : ''}`}>
        <div className="screen-list">
          {screenSpecs.map((screen) => (
            <div key={screen.id} className="screen-item">
              <div className="screen-info">
                <div className="screen-name">{screen.name}</div>
                <div className="screen-details">
                  <div className="detail-item">
                    <span className="detail-label">Dimensions:</span>
                    <span className="detail-value">{screen.dimensions.width}x{screen.dimensions.height}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Elements:</span>
                    <span className="detail-value">{screen.elements.length}</span>
                  </div>
                  {screen.navigation && (
                    <div className="detail-item">
                      <span className="detail-label">Navigation:</span>
                      <span className="detail-value">{screen.navigation.type}</span>
                    </div>
                  )}
                </div>
                {screen.dependencies.length > 0 && (
                  <div className="screen-dependencies">
                    <span className="dependencies-label">Dependencies:</span>
                    {screen.dependencies.join(', ')}
                  </div>
                )}
                {screen.permissions.length > 0 && (
                  <div className="screen-permissions">
                    <span className="permissions-label">Permissions:</span>
                    {screen.permissions.join(', ')}
                  </div>
                )}
              </div>
              <div className="screen-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => postToFigma('HIGHLIGHT_NODE', { nodeId: screen.id.replace('screen-','') })}
                >
                  Highlight
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`result-content ${activeTab === 'export' ? 'active' : ''}`}>
        <div className="export-section">
          <div className="section-title">Export Options</div>
          <div className="export-description">
            Generate a complete export bundle containing all screen specifications and assets.
          </div>
          <div className="export-buttons">
            <Button onClick={handleExport}>
              Generate Export Bundle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}