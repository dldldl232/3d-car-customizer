'use client';

import React, { useState, useEffect } from 'react';
import { Part, CarModel } from '@/lib/api';
import { apiClient } from '@/lib/api';
import PartDetails from './PartDetails';
import ManualCorrectionControls from './ManualCorrectionControls';

interface PartsSelectorProps {
  carModel: CarModel;
  selectedParts: Part[];
  onPartSelect: (part: Part) => void;
  onPartDeselect: (part: Part) => void;
}

export default function PartsSelector({ 
  carModel, 
  selectedParts, 
  onPartSelect, 
  onPartDeselect
}: PartsSelectorProps) {
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPartDetails, setSelectedPartDetails] = useState<Part | null>(null);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setIsLoadingParts(true);
        const parts = await apiClient.getParts(carModel.id);
        setAvailableParts(parts);
      } catch (error) {
        console.error('Failed to fetch parts:', error);
      } finally {
        setIsLoadingParts(false);
      }
    };

    if (carModel?.id) {
      fetchParts();
    }
  }, [carModel?.id]);

  const categories = [
    { id: 'all', name: 'All Parts', icon: '🔧' },
    { id: 'wheels', name: 'Wheels', icon: '⚙️' },
    { id: 'exterior', name: 'Exterior', icon: '🚗' },
    { id: 'performance', name: 'Performance', icon: '🏁' },
    { id: 'lights', name: 'Lights', icon: '💡' },
    { id: 'interior', name: 'Interior', icon: '🪑' }
  ];

  const filteredParts = selectedCategory === 'all' 
    ? availableParts 
    : availableParts.filter(part => part.type === selectedCategory);

  const totalCost = selectedParts.reduce((sum, part) => sum + part.price, 0);

  const handlePartClick = (part: Part) => {
    const isSelected = selectedParts.some(p => p.id === part.id);
    if (isSelected) {
      onPartDeselect(part);
    } else {
      onPartSelect(part);
    }
  };

  const getPartTypeColor = (type: string) => {
    switch (type) {
      case 'wheels':
        return 'border-gray-800 bg-gray-50';
      case 'exterior':
        return 'border-blue-600 bg-blue-50';
      case 'performance':
        return 'border-red-600 bg-red-50';
      case 'lights':
        return 'border-yellow-600 bg-yellow-50';
      case 'interior':
        return 'border-green-600 bg-green-50';
      default:
        return 'border-gray-600 bg-gray-50';
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

  if (isLoadingParts) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading parts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-[440px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Parts for {carModel.name}</h2>
        <span className="text-sm text-gray-500">{selectedParts.length} selected</span>
      </div>


      {/* Cost Summary
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total Cost</p>
            <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            $ Get Quote
          </button>
        </div>
      </div> */}

      {/* Category Tabs */}
      <div className="flex space-x-1 mb-8 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Parts List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredParts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No parts available for this category</p>
          </div>
        ) : (
          filteredParts.map((part) => {
            const isSelected = selectedParts.some(p => p.id === part.id);
            return (
              <div
                key={part.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : getPartTypeColor(part.type)
                }`}
                onClick={() => handlePartClick(part)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => {}} // Handled by onClick
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPartTypeIcon(part.type)}</span>
                      <div>
                        <p className="font-medium text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{part.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-green-600">${part.price}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartDetails(part);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
                
                {/* Part-specific indicators */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      {part.type === 'wheels' && (
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-gray-800 rounded-full"></span>
                          <span>Metallic finish applied</span>
                        </span>
                      )}
                      {part.type === 'lights' && (
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                          <span>Lighting effects active</span>
                        </span>
                      )}
                      {part.type === 'performance' && (
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Performance glow active</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Part Details Modal */}
      {selectedPartDetails && (
        <PartDetails
          part={selectedPartDetails}
          onClose={() => setSelectedPartDetails(null)}
        />
      )}
    </div>
  );
} 