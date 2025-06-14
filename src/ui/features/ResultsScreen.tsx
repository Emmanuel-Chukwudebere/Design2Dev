import React from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { postToFigma } from '../lib/utils';

export function ResultsScreen() {
  const { 
    screenSpecs, 
    isExporting, 
    isAnalyzing,
    setExporting, 
    setError, 
    setAppStage,
    designSystem 
  } = useStore();

  const handleExport = async () => {
    try {
      setExporting(true);
      postToFigma('EXPORT_SCREENS');
    } catch (error) {
      console.error('Export error:', error);
      setError({
        message: 'Failed to export screens',
        context: 'export'
      });
    }
  };

  const handleBack = () => {
    setAppStage('welcome');
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Analyzing Screens</h2>
              <p className="text-gray-600">
                Extracting components and generating specifications...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!screenSpecs || screenSpecs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">No Screens Selected</h1>
            <p className="text-gray-600">Please select frames in Figma to analyze.</p>
            <Button onClick={handleBack} variant="primary">
              Back to Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Analysis Complete
            </h1>
          </div>
          <p className="text-gray-600">
            We've analyzed your screens and generated detailed specifications for {designSystem} implementation.
          </p>
        </div>

        {/* Screen List */}
        <div className="space-y-4">
          {screenSpecs.map((screen, index) => (
            <Card key={screen.id || index} className="overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Screen Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">{screen.name}</h3>
                    <p className="text-sm text-gray-500">
                      {screen.dimensions.width} × {screen.dimensions.height}px
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                      {designSystem}
                    </span>
                  </div>
                </div>

                {/* Screen Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Component Stats */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Component Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Components:</span>
                        <span className="text-sm text-gray-500">
                          {screen.elements.length} components
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Design System:</span>
                        <span className="text-sm text-gray-500">
                          {designSystem}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Component Preview */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Key Components</h4>
                    <div className="space-y-2">
                      {screen.elements.slice(0, 3).map((element, idx) => (
                        <div key={element.id || idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          <span>{element.name}</span>
                        </div>
                      ))}
                      {screen.elements.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{screen.elements.length - 3} more components
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <div className="p-4 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ready to Export Your Analysis?</h3>
              <p className="text-purple-100">
                Generate a comprehensive export bundle with all specifications and assets.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="secondary"
                size="lg"
                leftIcon={
                  isExporting ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                }
                className="bg-white text-purple-600 hover:bg-gray-50 font-semibold px-6"
              >
                {isExporting ? 'Preparing Export...' : 'Export Analysis'}
              </Button>
              
              <Button
                onClick={handleBack}
                disabled={isExporting}
                variant="ghost"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
              >
                Back to Selection
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help with implementation?{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              View our guides
            </a>{' '}
            or{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 