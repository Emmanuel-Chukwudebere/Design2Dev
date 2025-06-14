// src/ui/features/ExportScreen.tsx
import React from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import JSZip from 'jszip';
import { ScreenSpec } from '../../shared/types';

interface ExportBundleData {
  screenSpecs: ScreenSpec[];
  assets: Array<{
    name: string;
    data: Blob;
  }>;
}

export function ExportScreen() {
  const { exportBundleData, isExporting, setExporting, setError, setAppStage } = useStore();

  const handleDownload = async () => {
    if (!exportBundleData) return;

    try {
      setExporting(true);
      const zip = new JSZip();

      // Create folders
      const specsFolder = zip.folder('specs');
      const promptsFolder = zip.folder('prompts');
      const assetsFolder = zip.folder('assets');

      if (!specsFolder || !promptsFolder || !assetsFolder) {
        throw new Error('Failed to create zip folders');
      }

      // Add screen specs and prompts
      for (const screen of exportBundleData.screenSpecs) {
        specsFolder.file(`${screen.name}.json`, JSON.stringify(screen, null, 2));
        if (screen.prompt) {
          promptsFolder.file(`${screen.name}.md`, screen.prompt);
        }
      }

      // Add assets
      for (const asset of exportBundleData.assets) {
        if (asset.data) {
          assetsFolder.file(asset.name, asset.data);
        }
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading:', error);
      setError({
        message: 'Failed to create export bundle',
        context: error instanceof Error ? error.message : 'export'
      });
    } finally {
      setExporting(false);
    }
  };

  const getExportStats = () => {
    if (!exportBundleData) return { screens: 0, assets: 0, totalSize: '0 KB' };
    
    const screenCount = exportBundleData.screenSpecs.length;
    const assetCount = exportBundleData.assets.length;
    
    // Rough size estimation (in practice you'd calculate actual sizes)
    const estimatedSize = screenCount * 15 + assetCount * 50; // KB estimation
    const sizeString = estimatedSize > 1024 ? `${(estimatedSize / 1024).toFixed(1)} MB` : `${estimatedSize} KB`;
    
    return { screens: screenCount, assets: assetCount, totalSize: sizeString };
  };

  const stats = getExportStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Export Complete
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your design specifications have been generated and are ready for download. 
            Everything you need to implement your designs is packaged and optimized for development.
          </p>
        </div>

        {/* Export Summary */}
        <Card variant="elevated" className="border-l-4 border-l-green-500">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Bundle Ready for Download</h3>
                <p className="text-gray-600 mb-4">
                  Your comprehensive design export includes all specifications, prompts, and assets needed for seamless development handoff.
                </p>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.screens}</div>
                    <div className="text-sm text-gray-500">Screen Specs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.assets}</div>
                    <div className="text-sm text-gray-500">Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalSize}</div>
                    <div className="text-sm text-gray-500">Est. Size</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bundle Contents */}
        <Card variant="outlined">
          <Card.Header>
            <Card.Title>What's Included in Your Export</Card.Title>
            <Card.Description>
              A complete development-ready package with everything your team needs
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">Screen Specifications</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  Detailed JSON files with component hierarchies, styling properties, layout specifications, and responsive behavior definitions.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">AI Implementation Prompts</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  Ready-to-use prompts optimized for AI coding assistants, ensuring accurate screen reproduction with proper context and requirements.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">Organized Assets</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  All images, icons, and visual assets exported with proper naming conventions, optimized formats, and organized folder structure.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Action Section */}
        <Card variant="ghost" className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to Download Your Export Bundle?</h3>
              <p className="text-green-100">
                Your design specifications are packaged and optimized for seamless development handoff. 
                Share this bundle with your development team to accelerate implementation.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button 
          onClick={handleDownload} 
                disabled={!exportBundleData || isExporting}
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
                className="bg-white text-green-600 hover:bg-gray-50 font-semibold px-8"
              >
                {isExporting ? 'Preparing Bundle...' : 'Download Export Bundle'}
              </Button>
              
              <Button
                onClick={() => setAppStage('results')}
                disabled={isExporting}
                variant="ghost"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
              >
                Back to Results
        </Button>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card variant="outlined">
          <Card.Header>
            <Card.Title>Next Steps for Your Team</Card.Title>
            <Card.Description>
              Maximize the value of your export bundle with these recommended workflows
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <h4 className="font-medium text-gray-900">Share with Development Team</h4>
                  <p className="text-sm text-gray-600">Distribute the export bundle to your developers for implementation planning and architecture decisions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <h4 className="font-medium text-gray-900">Use AI Implementation Prompts</h4>
                  <p className="text-sm text-gray-600">Leverage the generated prompts with AI coding assistants for rapid, accurate screen implementation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <h4 className="font-medium text-gray-900">Iterate and Refine</h4>
                  <p className="text-sm text-gray-600">Use the detailed specifications as a foundation for development, making adjustments as needed for your specific platform.</p>
                </div>
              </div>
            </div>
          </Card.Content>
      </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help with implementation?{' '}
            <a href="#" className="text-green-600 hover:text-green-700 font-medium">
              View our guides
            </a>{' '}
            or{' '}
            <a href="#" className="text-green-600 hover:text-green-700 font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}