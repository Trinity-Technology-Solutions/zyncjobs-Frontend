import React, { useState } from 'react';
import { Plus, ExternalLink, Github, Globe, X, Edit2 } from 'lucide-react';

interface Link {
  id: string;
  type: 'github' | 'linkedin' | 'portfolio';
  url: string;
  label: string;
}

interface LinksPortfolioProps {
  user: any;
  onUpdateUser: (userData: any) => void;
}

const LinksPortfolio: React.FC<LinksPortfolioProps> = ({ user, onUpdateUser }) => {
  const [links, setLinks] = useState<Link[]>(user?.portfolioLinks || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'github' as 'github' | 'linkedin' | 'portfolio',
    url: '',
    label: ''
  });

  const handleSaveLink = () => {
    const newLink: Link = {
      id: Date.now().toString(),
      ...formData
    };
    
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    onUpdateUser({ ...user, portfolioLinks: updatedLinks });
    
    setShowAddModal(false);
    setFormData({ type: 'github', url: '', label: '' });
  };

  const handleDeleteLink = (id: string) => {
    const updatedLinks = links.filter(l => l.id !== id);
    setLinks(updatedLinks);
    onUpdateUser({ ...user, portfolioLinks: updatedLinks });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'linkedin': return <ExternalLink className="w-5 h-5" />;
      case 'portfolio': return <Globe className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'github': return 'text-gray-700 hover:text-gray-900';
      case 'linkedin': return 'text-blue-600 hover:text-blue-800';
      case 'portfolio': return 'text-green-600 hover:text-green-800';
      default: return 'text-gray-600 hover:text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">Portfolio & Links</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Github className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600 font-medium mb-2">Share your professional links</p>
          <p className="text-sm text-gray-500 mb-6">
            Add your GitHub, LinkedIn, and portfolio links
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your First Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 ${getColor(link.type)}`}
              >
                {getIcon(link.type)}
                <span className="font-medium">{link.label}</span>
                <span className="text-sm text-gray-500">({link.type})</span>
              </a>
              <button
                onClick={() => handleDeleteLink(link.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAddModal(false);
            setFormData({ type: 'github', url: '', label: '' });
          }
        }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add New Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="github">GitHub</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="portfolio">Portfolio</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My GitHub Profile"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ type: 'github', url: '', label: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLink}
                disabled={!formData.url.trim() || !formData.label.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksPortfolio;