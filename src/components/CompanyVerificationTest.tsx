import React, { useState } from 'react';
import { EnhancedCompanyVerificationService as CompanyVerificationService } from '../services/enhancedCompanyVerificationService';

/**
 * Test Component for Company Verification Service
 * Use this to test the company verification functionality
 */
const CompanyVerificationTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleVerify = async () => {
    if (!email || !companyName) return;
    
    setLoading(true);
    try {
      const verificationResult = await CompanyVerificationService.verifyCompanyDomain(email, companyName);
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySearch = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const companySuggestions = await CompanyVerificationService.getCompanySuggestions(query);
      setSuggestions(companySuggestions);
    } catch (error) {
      console.error('Company search error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Company Verification Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              handleCompanySearch(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter company name"
          />
          
          {/* Company Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
              {suggestions.map((company, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCompanyName(company.name);
                    setSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                >
                  {company.logo && (
                    <img src={company.logo} alt={company.name} className="w-6 h-6 object-contain" />
                  )}
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.domain}</div>
                  </div>
                  {company.verified && (
                    <span className="ml-auto text-green-500 text-sm">✓ Verified</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter company email"
          />
        </div>
        
        <button
          onClick={handleVerify}
          disabled={loading || !email || !companyName}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Company Domain'}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-3">Verification Result</h3>
          
          {result.error ? (
            <div className="text-red-600">
              <strong>Error:</strong> {result.error}
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`p-3 rounded-md ${
                result.verificationMethod === 'company_database' ? 'bg-green-100 text-green-800' :
                result.verificationMethod === 'domain_check' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                <div className="font-medium">
                  {result.verificationMethod === 'company_database' ? '✅ Company Verified' :
                   result.verificationMethod === 'domain_check' ? '🔍 Corporate Domain' :
                   '⏳ Manual Review Required'}
                </div>
                <div className="text-sm mt-1">{result.message}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Valid:</strong> {result.isValid ? 'Yes' : 'No'}</div>
                <div><strong>Company Domain:</strong> {result.isCompanyDomain ? 'Yes' : 'No'}</div>
                <div><strong>Method:</strong> {result.verificationMethod}</div>
              </div>
              
              {result.companyProfile && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">Company Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {result.companyProfile.name}</div>
                    <div><strong>Domain:</strong> {result.companyProfile.domain}</div>
                    {result.companyProfile.industry && (
                      <div><strong>Industry:</strong> {result.companyProfile.industry}</div>
                    )}
                    {result.companyProfile.size && (
                      <div><strong>Size:</strong> {result.companyProfile.size}</div>
                    )}
                    <div><strong>Verified:</strong> {result.companyProfile.verified ? 'Yes' : 'No'}</div>
                  </div>
                  
                  {result.companyProfile.logo && (
                    <div className="mt-2">
                      <img 
                        src={result.companyProfile.logo} 
                        alt={result.companyProfile.name}
                        className="w-16 h-16 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Test Cases */}
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Test Cases</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Verified Company:</strong> Try "Google" + "user@google.com"</div>
          <div><strong>Corporate Domain:</strong> Try "New Corp" + "user@newcorp.com"</div>
          <div><strong>Personal Email:</strong> Try "Any Company" + "user@gmail.com"</div>
          <div><strong>Invalid Email:</strong> Try "Company" + "invalid-email"</div>
        </div>
      </div>
    </div>
  );
};

export default CompanyVerificationTest;