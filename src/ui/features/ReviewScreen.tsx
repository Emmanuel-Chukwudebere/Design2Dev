// src/ui/features/ReviewScreen.tsx
import React from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { ScreenSpec } from '../../shared/types';

export function ReviewScreen() {
  const { analyzedScreens, isAnalyzing, isExporting, exportBundle, setAppStage } = useStore();

  if (isAnalyzing) {
    return (
      <div className="review-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing screens...</p>
        </div>
      </div>
    );
  }

  if (!analyzedScreens || analyzedScreens.length === 0) {
    return (
      <div className="review-container">
        <div className="error-state">
          <p>No screens analyzed. Please select frames to analyze.</p>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      await exportBundle();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleBack = () => {
    setAppStage('welcome');
  };

  return (
    <div className="review-container">
      <div className="review-header">
        <div className="header-actions">
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
          <h2>Review Screens</h2>
        </div>
        <p className="subtitle">Found {analyzedScreens.length} screens</p>
      </div>

      <div className="screen-list">
        {analyzedScreens.map((screen: ScreenSpec) => (
          <div key={screen.id} className="screen-item">
            <div className="screen-header">
              <h3>{screen.name}</h3>
              <div className="screen-meta">
                <span className="screen-dimensions">
                  {screen.dimensions.width} × {screen.dimensions.height}
                </span>
                <span className="screen-design-system">
                  {screen.designSystem}
                </span>
              </div>
            </div>

            <div className="screen-details">
              <div className="detail-group">
                <h4>Main Container</h4>
                <div className="detail-content">
                  <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">Frame</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Layout</span>
                    <span className="detail-value">
                      {screen.layout.layoutMode || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {screen.elements.slice(0, 3).map((element) => (
                <div key={element.id} className="detail-group">
                  <h4>{element.name}</h4>
                  <div className="detail-content">
                    <div className="detail-row">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{element.type}</span>
                    </div>
                    {element.content && (
                      <div className="detail-row">
                        <span className="detail-label">Content</span>
                        <span className="detail-value">{element.content}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="action-bar">
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export Bundle'}
        </Button>
      </div>
    </div>
  );
}