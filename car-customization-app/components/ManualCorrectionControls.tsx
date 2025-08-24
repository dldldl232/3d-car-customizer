import React from 'react';
import { Part } from '@/lib/api';

interface ManualCorrectionControlsProps {
  selectedParts?: Part[];
  manualMode: boolean;
  onManualModeToggle: () => void;
  onSaveManualAdjustments: () => void;
  onResetToAuto: () => void;
  onClearAllAdjustments: () => void;
}

export default function ManualCorrectionControls({ 
  selectedParts, 
  manualMode, 
  onManualModeToggle, 
  onSaveManualAdjustments,
  onResetToAuto,
  onClearAllAdjustments
}: ManualCorrectionControlsProps) {
  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white mt-4">
      <h3 className="text-lg font-semibold mb-3">Manual Correction</h3>
      <div className="text-xs text-yellow-300 mb-2">
        Status: {manualMode ? '🔧 MANUAL MODE ACTIVE' : '🤖 Auto Mode'}
      </div>
      {manualMode && selectedParts && selectedParts.length > 0 && (
        <div className="text-xs text-blue-300 mb-2">
          🎯 Controlling: {selectedParts[0]?.name || 'None'}
          {selectedParts.length > 1 && ` (+${selectedParts.length - 1} others)`}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="manualMode"
            checked={manualMode}
            onChange={onManualModeToggle}
            className="w-4 h-4"
          />
          <label htmlFor="manualMode" className="text-sm">
            Enable Manual Mode
          </label>
        </div>
        
        {manualMode && (
          <div className="space-y-2">
            <p className="text-xs text-gray-300">
              Drag the transform controls to adjust part position
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={onSaveManualAdjustments}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                Save Adjustments
              </button>
              
              <button
                onClick={onResetToAuto}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
              >
                Reset to Auto
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClearAllAdjustments}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Clear All Adjustments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
