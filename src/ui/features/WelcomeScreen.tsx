import React, { useState } from 'react';
import { useStore } from '../store';
import { postToFigma } from '../lib/utils';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { designSystems } from '../../plugin/systems';
import { SupportedDesignSystem } from '../../shared/types';

export function WelcomeScreen() {
  const { setAppStage, setDesignSystem, pageInfo, setError } = useStore();
  const [selectedSystem, setSelectedSystem] = useState<SupportedDesignSystem>('react-native-paper');

  const handleDesignSystemChange = (system: SupportedDesignSystem) => {
    setSelectedSystem(system);
    setDesignSystem(system);
  };

  const handleAnalyzeClick = () => {
    if (!pageInfo || pageInfo.nodeCount === 0) {
      setError({ 
        message: 'No frames selected for analysis',
        context: 'Please select 1-8 frames from your current page to begin the analysis process.'
      });
      return;
    }
    setAppStage('analyzing');
    postToFigma('ANALYZE_SCREENS', { designSystem: selectedSystem });
  };

  const getSelectionStatus = () => {
    if (!pageInfo) return { status: 'none', message: 'Loading page information...', variant: 'secondary' as const };
    if (pageInfo.nodeCount === 0) return { status: 'none', message: 'No frames selected', variant: 'secondary' as const };
    if (pageInfo.nodeCount > 8) return { status: 'too-many', message: `${pageInfo.nodeCount} frames selected (max 8)`, variant: 'danger' as const };
    return { status: 'ready', message: `${pageInfo.nodeCount} frame${pageInfo.nodeCount === 1 ? '' : 's'} selected`, variant: 'primary' as const };
  };

  const selectionStatus = getSelectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">D2D</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Design2Dev
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your Figma designs into production-ready specifications. 
            Extract comprehensive component details, design tokens, and implementation guides instantly.
          </p>
        </div>

        {/* Selection Status */}
        <Card variant="elevated" className="border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Current Selection</h3>
              {pageInfo ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Page: <span className="font-medium text-gray-900">{pageInfo.name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectionStatus.variant === 'primary' ? 'bg-green-100 text-green-800' :
                      selectionStatus.variant === 'danger' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectionStatus.message}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading page information...</p>
              )}
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card variant="outlined">
          <Card.Header>
            <Card.Title>Before You Start</Card.Title>
            <Card.Description>
              Ensure your design meets these requirements for optimal results
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Selection Requirements
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Select 1-8 top-level frames</li>
                  <li>• Each frame should represent a complete screen</li>
                  <li>• Ensure frames have descriptive names</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Design Best Practices
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Use consistent naming conventions</li>
                  <li>• Organize layers in logical groups</li>
                  <li>• Apply proper constraints and spacing</li>
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Design System Selection */}
        <Card variant="elevated">
          <Card.Header>
            <Card.Title>Choose Your Target Framework</Card.Title>
            <Card.Description>
              Select the design system or framework you'll use for implementation. 
              This will optimize the generated specifications for your chosen technology.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(designSystems).map((system) => (
                <Card
                  key={system.name}
                  variant={selectedSystem === system.name ? 'elevated' : 'outlined'}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSystem === system.name 
                      ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => handleDesignSystemChange(system.name as SupportedDesignSystem)}
                  padding="md"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 ${
                      selectedSystem === system.name 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedSystem === system.name && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{system.name}</h3>
                      <p className="text-sm text-gray-600">{system.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Action Section */}
        <Card variant="ghost" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to Extract Your Design?</h3>
              <p className="text-blue-100">
                {selectionStatus.status === 'ready' 
                  ? `Transform ${pageInfo?.nodeCount} selected frame${pageInfo?.nodeCount === 1 ? '' : 's'} into detailed specifications`
                  : selectionStatus.status === 'too-many'
                  ? 'Please select no more than 8 frames to proceed'
                  : 'Select frames from your current page to begin the analysis'
                }
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyzeClick}
                disabled={selectionStatus.status !== 'ready'}
                variant="secondary"
                size="lg"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help? Check our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              documentation
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}