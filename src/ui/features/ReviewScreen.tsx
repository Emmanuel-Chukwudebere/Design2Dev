// src/ui/features/ReviewScreen.tsx
import React from 'react';
import { useStore } from '../store';
import { ScreenSpec, IndividualCorners } from '../../shared/types';
import { postToFigma } from '../lib/utils';

export function ReviewScreen() {
  const { 
    screenSpecs, 
    designSystem,
    isAnalyzing,
    isExporting,
    setAppStage,
    setError
  } = useStore();

  const handleExport = () => {
    console.log('Starting export with specs:', screenSpecs);
    postToFigma('EXPORT_BUNDLE', { screenSpecs });
  };

  if (isAnalyzing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Analyzing screens...</div>
      </div>
    );
  }

  if (isExporting) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Generating export bundle...</div>
      </div>
    );
  }

  if (!screenSpecs || screenSpecs.length === 0) {
    return (
      <div className="error-container">
        <h3>No Screens Analyzed</h3>
        <p>Please select frames to analyze and try again.</p>
        <button 
          className="button primary"
          onClick={() => setAppStage('welcome')}
        >
          Back to Selection
        </button>
      </div>
    );
  }

  const formatCornerRadius = (radius: number | IndividualCorners): string => {
    if (typeof radius === 'number') {
      return `${radius}px`;
    }
    return `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`;
  };

  return (
    <div className="review-container">
      <div className="review-header">
        <h2>Screen Analysis</h2>
        <p className="subtitle">Review the analyzed screens before exporting</p>
      </div>

      <div className="screen-list">
        {screenSpecs.map((spec, index) => (
          <div key={index} className="screen-item">
            <div className="screen-header">
              <h3>{spec.name}</h3>
              <span className="screen-dimensions">{spec.dimensions.width}x{spec.dimensions.height}</span>
            </div>
            
            <div className="screen-details">
              <div className="detail-group">
                <h4>Layout</h4>
                <ul>
                  <li>Mode: {spec.layout.layoutMode || 'NONE'}</li>
                  {spec.layout.primaryAlign && <li>Primary Align: {spec.layout.primaryAlign}</li>}
                  {spec.layout.counterAlign && <li>Counter Align: {spec.layout.counterAlign}</li>}
                  {spec.layout.padding && <li>Padding: {spec.layout.padding.top}px</li>}
                  {spec.layout.itemSpacing && <li>Item Spacing: {spec.layout.itemSpacing}px</li>}
                </ul>
              </div>

              <div className="detail-group">
                <h4>Elements</h4>
                <ul>
                  {spec.elements.map((element, idx) => (
                    <li key={idx}>
                      {element.type} - {element.name}
                      {element.styling && (
                        <ul>
                          {element.styling.fills && <li>Fills: {element.styling.fills.length}</li>}
                          {element.styling.strokes && <li>Strokes: {element.styling.strokes.length}</li>}
                          {element.styling.cornerRadius && (
                            <li>Corner Radius: {formatCornerRadius(element.styling.cornerRadius)}</li>
                          )}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {spec.elements.some(e => e.autoLayout) && (
                <div className="detail-group">
                  <h4>Auto Layout</h4>
                  <ul>
                    {spec.elements.map((element, idx) => (
                      element.autoLayout && (
                        <li key={idx}>
                          {element.name}:
                          <ul>
                            <li>Direction: {element.autoLayout.direction}</li>
                            <li>Alignment: {element.autoLayout.alignment}</li>
                            <li>Spacing: {element.autoLayout.spacing}px</li>
                            <li>Padding: {element.autoLayout.padding.top}px</li>
                          </ul>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}

              {spec.elements.some(e => e.effects?.length) && (
                <div className="detail-group">
                  <h4>Effects</h4>
                  <ul>
                    {spec.elements.map((element, idx) => (
                      element.effects?.map((effect, effectIdx) => (
                        <li key={`${idx}-${effectIdx}`}>
                          {element.name}: {effect.type}
                          {effect.properties.offset && ` (${effect.properties.offset.x}px, ${effect.properties.offset.y}px)`}
                          {effect.properties.radius && ` - Radius: ${effect.properties.radius}px`}
                          {effect.properties.color && ` - Color: ${effect.properties.color}`}
                        </li>
                      ))
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="action-bar">
        <button 
          className="button primary"
          onClick={handleExport}
        >
          Generate Export Bundle
        </button>
      </div>
    </div>
  );
}