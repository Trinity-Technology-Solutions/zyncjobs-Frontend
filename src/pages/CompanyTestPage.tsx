import React, { useState } from 'react';
import CompanyAutoSuggest from '../components/CompanyAutoSuggest';

interface CompanyTestPageProps {
  onNavigate: (page: string) => void;
}

const CompanyTestPage: React.FC<CompanyTestPageProps> = ({ onNavigate }) => {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <button 
              onClick={() => onNavigate('new-home')}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              LinkedIn-Style Company Search
            </h1>
            <p className="text-gray-600">
              Type a company name to see auto-suggestions with logos and follower counts
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <CompanyAutoSuggest
                placeholder="Start typing a company name (e.g. Google, Microsoft)..."
                onSelect={(company) => {
                  setSelectedCompany(company);
                  console.log('Selected company:', company);
                }}
              />
            </div>

            {selectedCompany && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Selected Company:</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {selectedCompany.logo ? (
                      <img
                        src={selectedCompany.logo}
                        alt={selectedCompany.name}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-200 rounded flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {selectedCompany.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedCompany.name}</div>
                    <div className="text-sm text-gray-600">
                      {selectedCompany.followers.toLocaleString()} followers
                    </div>
                    <div className="text-xs text-gray-500">ID: {selectedCompany.id}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Type 2+ characters to trigger search</li>
                <li>• Results show company logo + name + followers</li>
                <li>• Logos are fetched from Clearbit API automatically</li>
                <li>• Click any suggestion to auto-fill the form</li>
                <li>• Same technology used by LinkedIn and major job portals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyTestPage;