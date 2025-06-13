import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface ErrorScreenProps {
  error: {
    message: string;
    context: string;
  };
  onRetry: () => void;
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  const getErrorIcon = () => {
    const contextLower = error.context.toLowerCase();
    
    if (contextLower.includes('network') || contextLower.includes('connection')) {
      return (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    }
    
    if (contextLower.includes('selection') || contextLower.includes('frame')) {
      return (
        <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getErrorTitle = () => {
    const contextLower = error.context.toLowerCase();
    
    if (contextLower.includes('network') || contextLower.includes('connection')) {
      return 'Connection Issue';
    }
    
    if (contextLower.includes('selection') || contextLower.includes('frame')) {
      return 'Selection Required';
    }
    
    if (contextLower.includes('analysis')) {
      return 'Analysis Failed';
    }
    
    if (contextLower.includes('export')) {
      return 'Export Failed';
    }
    
    return 'Something Went Wrong';
  };

  const getErrorSuggestions = () => {
    const contextLower = error.context.toLowerCase();
    
    if (contextLower.includes('selection') || contextLower.includes('frame')) {
      return [
        'Select 1-8 frames from your current Figma page',
        'Ensure frames are top-level (not nested)',
        'Check that frames have proper names',
        'Refresh the plugin if issues persist'
      ];
    }
    
    if (contextLower.includes('analysis')) {
      return [
        'Check your internet connection',
        'Ensure frames contain valid design elements',
        'Try reducing the number of selected frames',
        'Verify frame complexity is reasonable'
      ];
    }
    
    if (contextLower.includes('export')) {
      return [
        'Check available storage space',
        'Ensure stable internet connection',
        'Try exporting fewer screens at once',
        'Clear browser cache and retry'
      ];
    }
    
    return [
      'Check your internet connection',
      'Refresh the plugin and try again',
      'Ensure Figma is running properly',
      'Contact support if the issue persists'
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon & Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              {getErrorIcon()}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {getErrorTitle()}
            </h1>
            <p className="text-gray-600">
              We encountered an issue while processing your request
            </p>
          </div>
        </div>

        {/* Error Details */}
        <Card variant="elevated" className="border-l-4 border-l-red-500">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Error Details</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium mb-1">
                  {error.message}
                </p>
                {error.context && (
                  <p className="text-xs text-red-600">
                    Context: {error.context}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">How to Fix This</h3>
              <ul className="space-y-2">
                {getErrorSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onRetry}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="md"
            fullWidth
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Restart Plugin
          </Button>
        </div>

        {/* Support Link */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Still having trouble?{' '}
            <a 
              href="#" 
              className="text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => {
                e.preventDefault();
                // Add support contact logic here
              }}
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}