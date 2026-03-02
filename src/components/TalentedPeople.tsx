import React from 'react';

interface TalentedPeopleProps {
  onNavigate?: (page: string, data?: any) => void;
}

const TalentedPeople: React.FC<TalentedPeopleProps> = ({ onNavigate }) => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <h6 className="text-blue-600 font-semibold text-lg">Talented People</h6>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              Over all 10,00+ Talented People Registered in Our Website
            </h2>
            <p className="text-gray-600 leading-relaxed">
              It is a long established fact that a reader will be distracted by the
              readable content of a page when looking at its layout.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('register')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join Now
            </button>
          </div>

          {/* Right Content - Professional Image */}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Professional team meeting"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentedPeople;