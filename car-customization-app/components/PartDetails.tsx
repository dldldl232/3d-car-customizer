'use client';

import React from 'react';
import { Part } from '@/lib/api';

interface PartDetailsProps {
  part: Part;
  onClose: () => void;
}

export default function PartDetails({ part, onClose }: PartDetailsProps) {
  const getPartTypeColor = (type: string) => {
    switch (type) {
      case 'wheels':
        return 'bg-gray-800 text-white';
      case 'exterior':
        return 'bg-blue-600 text-white';
      case 'performance':
        return 'bg-red-600 text-white';
      case 'lights':
        return 'bg-yellow-600 text-black';
      case 'interior':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getPartTypeIcon = (type: string) => {
    switch (type) {
      case 'wheels':
        return '⚙️';
      case 'exterior':
        return '🚗';
      case 'performance':
        return '🏁';
      case 'lights':
        return '💡';
      case 'interior':
        return '🪑';
      default:
        return '🔧';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Part Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Part Header */}
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPartTypeIcon(part.type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{part.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPartTypeColor(part.type)}`}>
                {part.type}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${part.price}</div>
            <div className="text-sm text-gray-600">Estimated cost</div>
          </div>

          {/* Part Specifications */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Specifications</h4>
            
            {part.attach_to && (
              <div className="flex justify-between">
                <span className="text-gray-600">Attachment Point:</span>
                <span className="font-medium">{part.attach_to}</span>
              </div>
            )}

            {part.intrinsic_size && (
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{part.intrinsic_size}</span>
              </div>
            )}

            {/* Part-specific modifications */}
            <div className="mt-4">
              <h5 className="font-semibold text-gray-900 mb-2">Modifications Applied:</h5>
              <div className="space-y-2">
                {part.type === 'wheels' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-3 h-3 bg-gray-800 rounded-full"></span>
                    <span>Metallic finish with low roughness</span>
                  </div>
                )}
                {part.type === 'lights' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    <span>Emissive lighting effect</span>
                  </div>
                )}
                {part.type === 'performance' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>Subtle performance glow</span>
                  </div>
                )}
                {part.type === 'exterior' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span>Enhanced surface properties</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attribution */}
          {part.attribution_html && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">Attribution</h5>
              <div 
                className="text-sm text-blue-800"
                dangerouslySetInnerHTML={{ __html: part.attribution_html }}
              />
            </div>
          )}

          {/* Source */}
          {part.source_url && (
            <div className="mt-4">
              <a
                href={part.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View original on Sketchfab →
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 