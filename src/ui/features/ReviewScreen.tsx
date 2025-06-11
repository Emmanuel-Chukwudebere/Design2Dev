// src/ui/features/ReviewScreen.tsx
import React, { useState } from 'react';
import { useStore } from '../lib/state';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { designSystems } from '../../plugin/systems';
import { ComponentSpec, SupportedDesignSystem } from '../../shared/types';

export function ReviewScreen() {
  const { discoveredComponents, screenSpecs, setStage } = useStore();
  const [editableComponents, setEditableComponents] = useState<ComponentSpec[]>(discoveredComponents);

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

  return (
    <div style={{ padding: 'var(--space-4)', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h2 style={{ padding: '0 var(--space-4)' }}>Review & Map</h2>
        {editableComponents.map((comp) => (
          <Card key={comp.id} style={{ marginBottom: 'var(--space-6)' }}>
            <input
              type="text"
              value={comp.name}
              onChange={(e) => handleUpdateComponent(comp.id, { name: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: 'var(--space-3)',
                fontSize: '16px',
                fontWeight: 600,
                boxSizing: 'border-box',
                marginBottom: 'var(--space-4)'
              }}
            />
            {comp.variants.length > 0 && (
                <p style={{fontSize: '12px', color: '#6B7280', margin: '0 0 var(--space-4) 0'}}>{comp.variants.length} variant(s) detected.</p>
            )}
            
            <select
                value={comp.mapping.designSystem}
                onChange={(e) => handleUpdateComponent(comp.id, { mapping: { ...comp.mapping, designSystem: e.target.value as SupportedDesignSystem }})}
                style={{width: '100%', padding: 'var(--space-3)', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: 'var(--space-2)'}}
            >
                <option value="Custom">Custom Component</option>
                {designSystems.map(ds => (
                    <option key={ds.name} value={ds.name}>{ds.name}</option>
                ))}
            </select>
            <p style={{fontSize: '12px', color: '#6B7280', margin: '0 0 var(--space-4) 0', padding: '0 var(--space-1)'}}>
              {comp.mapping.designSystem === 'Custom' ? 'Generates a new component from scratch.' : designSystems.find(ds => ds.name === comp.mapping.designSystem)?.description}
            </p>
            <Button variant="secondary" onClick={() => postToFigma('HIGHLIGHT_NODE', { nodeId: comp.id.replace('comp-','') })} style={{width: '100%'}}>Highlight on Canvas</Button>
          </Card>
        ))}
      </div>
      <div style={{padding: 'var(--space-4) 0'}}>
        <Button onClick={handleExport} style={{ width: '100%' }}>Proceed to Export</Button>
      </div>
    </div>
  );
}