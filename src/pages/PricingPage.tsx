import React from 'react';
import { Check, X, Star, Crown, Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, user, onLogout }) => {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "Forever",
      icon: Star,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      features: [
        { text: "10 Job Postings", included: true },
        { text: "Basic Job Listing", included: true },
        { text: "Standard Support", included: true },
        { text: "Basic Analytics", included: true },
        { text: "Candidate Search", included: false },
        { text: "Featured Jobs", included: false },
        { text: "Priority Support", included: false },
        { text: "Advanced Analytics", included: false }
      ]
    },
    {
      name: "Professional",
      price: "₹2,999",
      period: "per month",
      icon: Crown,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      popular: true,
      features: [
        { text: "50 Job Postings", included: true },
        { text: "Featured Job Listings", included: true },
        { text: "Candidate Search (200+ skills)", included: true },
        { text: "Priority Support", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Interview Scheduling", included: true },
        { text: "Company Branding", included: true },
        { text: "Resume Database Access", included: true }
      ]
    },
    {
      name: "Enterprise",
      price: "₹9,999",
      period: "per month",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      features: [
        { text: "Unlimited Job Postings", included: true },
        { text: "Premium Featured Listings", included: true },
        { text: "Advanced Candidate Search", included: true },
        { text: "Dedicated Account Manager", included: true },
        { text: "Custom Analytics Dashboard", included: true },
        { text: "Bulk Operations", included: true },
        { text: "API Access", included: true },
        { text: "White-label Solutions", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton 
            onClick={() => onNavigate && onNavigate('dashboard')}
            text="Back to Dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
          />
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with 10 free job postings, then upgrade for unlimited access to our powerful hiring tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <div
                  key={index}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 ${plan.borderColor} p-8 hover:shadow-xl transition-all duration-300 ${plan.popular ? 'md:scale-105' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${plan.bgColor} rounded-full mb-4`}>
                      <IconComponent className={`w-8 h-8 ${plan.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      if (plan.name === 'Free') {
                        if (user) {
                          // User is already logged in, go to dashboard
                          onNavigate('dashboard');
                        } else {
                          // User not logged in, go to role selection
                          onNavigate('role-selection');
                        }
                      } else {
                        alert(`${plan.name} plan coming soon! Contact us for early access.`);
                      }
                    }}
                    className={`w-full ${plan.buttonColor} text-white py-3 px-6 rounded-lg font-semibold transition-colors`}
                  >
                    {plan.name === 'Free' ? (user ? 'Go to Dashboard' : 'Get Started Free') : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens after 10 free job postings?
                </h3>
                <p className="text-gray-600">
                  You'll need to upgrade to a paid plan to post more jobs. Your existing jobs will remain active.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I search candidates for free?
                </h3>
                <p className="text-gray-600">
                  Basic candidate viewing is free, but advanced search with 200+ skills requires a Professional plan.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a contract commitment?
                </h3>
                <p className="text-gray-600">
                  No, all plans are month-to-month. You can upgrade, downgrade, or cancel anytime.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-gray-600">
                  Yes! Contact us for custom pricing and features tailored to your organization's needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PricingPage;