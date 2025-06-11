// src/ui/features/ReviewScreen.tsx
import React, { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { designSystems } from '../../plugin/systems';
import { ComponentSpec, SupportedDesignSystem } from '../../shared/types';
import { suggestMappings } from '../../plugin/mapping';

export function ReviewScreen() {
  const { discoveredComponents, screenSpecs, setStage } = useStore();
  const [editableComponents, setEditableComponents] = useState<ComponentSpec[]>(discoveredComponents);
  const [activeTab, setActiveTab] = useState<'components' | 'screens' | 'export'>('components');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const handleUpdateComponent = (id: string, updates: Partial<ComponentSpec>) => {
    setEditableComponents(
      editableComponents.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleExport = () => {
    setStage('exporting');
    postToFigma('GENERATE_EXPORT', {
      finalComponents: editableComponents,
      finalScreens: screenSpecs,
    });
  };

  const renderMappingSuggestions = (component: ComponentSpec) => {
    const suggestions = suggestMappings(component);
    if (suggestions.length === 0) return null;

    return (
      <div className="mapping-suggestion">
        <div className="mapping-suggestion-title">Suggested Mappings</div>
        {suggestions.map((suggestion, index) => (
          <div key={index} className="mapping-suggestion-desc">
            {suggestion.reasoning} (Confidence: {Math.round(suggestion.confidence * 100)}%)
          </div>
        ))}
      </div>
    );
  };

  const renderVariantDiff = (component: ComponentSpec) => {
    if (component.variants.length === 0) return null;

    return (
      <div className="variant-diff">
        <div className="variant-diff-title">Variant Differences</div>
        {component.variants.map((variant, index) => {
          const styleDiff = Object.entries(variant.styling)
            .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(component.styling[key as keyof typeof component.styling]))
            .map(([key, value]) => ({
              property: key,
              value: JSON.stringify(value),
            }));

          return (
            <div key={index} className="variant-diff-item">
              <div className="variant-diff-label">Variant {index + 1}</div>
              <div className="variant-diff-value">
                {styleDiff.map(diff => `${diff.property}: ${diff.value}`).join(', ')}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="result-summary">
        <Card>
          <div className="summary-number">{editableComponents.length}</div>
          <div className="summary-label">Components</div>
        </Card>
        <Card>
          <div className="summary-number">{screenSpecs.length}</div>
          <div className="summary-label">Screens</div>
        </Card>
      </div>

      <div className="result-tabs">
        <div 
          className={`result-tab ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </div>
        <div 
          className={`result-tab ${activeTab === 'screens' ? 'active' : ''}`}
          onClick={() => setActiveTab('screens')}
        >
          Screens
        </div>
        <div 
          className={`result-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </div>
      </div>

      <div className={`result-content ${activeTab === 'components' ? 'active' : ''}`}>
        <div className="component-list">
          {editableComponents.map((comp) => (
            <div key={comp.id} className="component-item">
              <div className="component-info">
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => handleUpdateComponent(comp.id, { name: e.target.value })}
                  className="component-name"
                />
                <div className="component-category">
                  {comp.category} • {comp.mapping.designSystem}
                </div>
                {comp.variants.length > 0 && (
                  <div className="component-variants">
                    {comp.variants.length} variant{comp.variants.length !== 1 ? 's' : ''} detected
                  </div>
                )}
                {renderMappingSuggestions(comp)}
                {renderVariantDiff(comp)}
              </div>
              <div className="component-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => postToFigma('HIGHLIGHT_NODE', { nodeId: comp.id.replace('comp-','') })}
                >
                  Highlight
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`result-content ${activeTab === 'screens' ? 'active' : ''}`}>
        <div className="component-list">
          {screenSpecs.map((screen) => (
            <div key={screen.id} className="component-item">
              <div className="component-info">
                <div className="component-name">{screen.name}</div>
                <div className="component-category">
                  {screen.componentInstances.length} components • {screen.dimensions.width}x{screen.dimensions.height}
                </div>
                {screen.dependencies.length > 0 && (
                  <div className="screen-dependencies">
                    Dependencies: {screen.dependencies.join(', ')}
                  </div>
                )}
              </div>
              <div className="component-actions">
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
        <div className="download-section">
          <div className="section-title">Export Options</div>
          <div className="export-description">
            Generate a complete export bundle containing all components, screens, and assets.
          </div>
          <div className="download-buttons">
            <Button onClick={handleExport}>
              Generate Export Bundle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}