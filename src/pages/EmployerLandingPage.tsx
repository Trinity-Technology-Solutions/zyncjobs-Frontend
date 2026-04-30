import React from 'react';
import { 
  Search, 
  MapPin, 
  Bot, 
  Sparkles, 
  Brain, 
  Zap, 
  Users, 
  Building2, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Edit,
  Database,
  Filter,
  BarChart3,
  Quote,
  Globe,
  Share2,
  Menu,
  Briefcase,
  CreditCard,
  Rocket
} from 'lucide-react';

interface EmployerLandingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const EmployerLandingPage: React.FC<EmployerLandingPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <Briefcase className="text-blue-600 text-3xl" />
            <span className="text-2xl font-extrabold text-blue-600 font-manrope tracking-tight">ZyncJobs</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-manrope font-semibold tracking-tight">
            <a className="text-blue-600 border-b-2 border-blue-600 py-1" href="#solutions">Solutions</a>
            <a className="text-slate-600 hover:text-blue-700 transition-colors" href="#pricing">Pricing</a>
            <button 
              onClick={() => onNavigate('employer-register')}
              className="text-slate-600 hover:text-blue-700 transition-colors"
            >
              Join Zync
            </button>
            <button 
              onClick={() => onNavigate('job-posting')}
              className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Post a Job
            </button>
          </div>
          
          <button className="md:hidden">
            <Menu className="text-slate-600" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Hero Section */}
        <section className="py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">India's Premium Recruitment Hub</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Hire Top Talent in India
            </h1>
            
            <p className="text-lg text-gray-600 max-w-lg">
              Access a vetted pool of high-performing professionals across engineering, design, and operations. 
              Start hiring today with AI-driven matching.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onNavigate('job-posting')}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Post a Job Free <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('candidate-search')}
                className="border border-gray-300 px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                Search Candidates
              </button>
            </div>
            
            <div className="pt-8 flex flex-wrap gap-8 border-t border-gray-200">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-blue-600">500K+</span>
                <span className="text-sm text-gray-500">Active Candidates</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-blue-600">10K+</span>
                <span className="text-sm text-gray-500">Hiring Companies</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-blue-600">24h</span>
                <span className="text-sm text-gray-500">Avg. First Response</span>
              </div>
            </div>
          </div>
          
          <div className="relative mt-12 lg:mt-0">
            <div className="aspect-square rounded-full bg-blue-100 absolute -top-12 -right-12 w-64 h-64 blur-3xl opacity-30"></div>
            <div className="relative bg-white rounded-xl shadow-2xl p-4 md:p-6 overflow-hidden border border-slate-100">
              <img 
                alt="Hiring Team" 
                className="w-full h-[400px] object-cover rounded-lg" 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              />
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-16" id="solutions">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose ZyncJobs?</h2>
            <p className="text-gray-600">Built for the specific needs of the Indian recruitment market.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Matching</h3>
              <p className="text-gray-600">Our proprietary algorithms rank candidates based on 50+ data points, delivering the top 5% matches instantly.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Pan-India Pool</h3>
              <p className="text-gray-600">From Tier-1 hubs to emerging talent in Tier-2 cities, access a diverse geographical talent landscape across India.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Cost-Effective</h3>
              <p className="text-gray-600">Save up to 60% on hiring costs compared to traditional agencies with our direct-to-candidate transparent pricing.</p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-gray-50 rounded-3xl px-8 md:px-24">
          <h2 className="text-3xl font-bold text-center mb-16">Simple 3-Step Hiring</h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-gray-300"></div>
            
            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg">1</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Post Your Job</h4>
                <p className="text-gray-600">List your requirements using our smart templates in under 2 minutes.</p>
              </div>
            </div>
            
            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg">2</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Vet & Shortlist</h4>
                <p className="text-gray-600">Review AI-matched candidates and use our screening tools to filter.</p>
              </div>
            </div>
            
            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold relative z-10 shadow-lg">3</div>
              <div>
                <h4 className="text-xl font-semibold mb-2">Interview & Hire</h4>
                <p className="text-gray-600">Schedule interviews directly and close roles with seamless onboarding.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <Edit className="text-blue-600 w-8 h-8" />
                  <span className="font-semibold">Smart Posting</span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 mt-8">
                  <Database className="text-blue-600 w-8 h-8" />
                  <span className="font-semibold">Resume Database</span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <Filter className="text-blue-600 w-8 h-8" />
                  <span className="font-semibold">Screening Tools</span>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3 mt-8">
                  <BarChart3 className="text-blue-600 w-8 h-8" />
                  <span className="font-semibold">Insight Dashboards</span>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-bold">The ultimate recruiter's toolkit</h2>
              <p className="text-lg text-gray-600">Everything you need to manage your hiring pipeline in one unified platform. No more spreadsheets or fragmented emails.</p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-blue-600 w-5 h-5" />
                  <span>Bulk candidate outreach via SMS/Email</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-blue-600 w-5 h-5" />
                  <span>One-click background verification</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-blue-600 w-5 h-5" />
                  <span>Integrated ATS for interview tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24" id="pricing">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-gray-600">Plans that scale with your hiring needs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl border border-slate-100 flex flex-col">
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-2">Free</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹0</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-auto">
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  2 Active Job Posts
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Standard Matching
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Email Support
                </li>
              </ul>
              
              <button 
                onClick={() => onNavigate('employer-register')}
                className="w-full mt-8 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl border-2 border-blue-600 relative shadow-xl flex flex-col scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-2">Starter</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹10k</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-auto">
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  10 Active Job Posts
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  100 Resume Credits
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Priority Matching
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Chat Support
                </li>
              </ul>
              
              <button 
                onClick={() => onNavigate('employer-register')}
                className="w-full mt-8 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 shadow-lg transition-all"
              >
                Choose Starter
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-xl border border-slate-100 flex flex-col">
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-2">Pro</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹25k</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-auto">
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Unlimited Job Posts
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  500 Resume Credits
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  API Access
                </li>
                <li className="flex gap-2 text-sm">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                  Dedicated Account Manager
                </li>
              </ul>
              
              <button className="w-full mt-8 border border-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 relative">
              <Quote className="text-blue-200 w-16 h-16 absolute top-8 left-8 opacity-20" />
              <p className="text-lg italic mb-8 relative z-10">
                "ZyncJobs transformed our hiring process. We closed three critical engineering roles in under two weeks. 
                The quality of candidates is unparalleled in the Indian market."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                <div>
                  <p className="font-semibold">Hrithik Raman</p>
                  <p className="text-sm text-gray-500">HR Director, Trinity Technology Solutions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 relative">
              <Quote className="text-blue-200 w-16 h-16 absolute top-8 left-8 opacity-20" />
              <p className="text-lg italic mb-8 relative z-10">
                "The screening tools alone saved us 40 hours of work per month. It's the most efficient platform we've used 
                for mass recruitment campaigns across Chennai and Bangalore."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                <div>
                  <p className="font-semibold">Ananya Verma</p>
                  <p className="text-sm text-gray-500">Talent Acquisition, Nambikkai India</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 mb-24">
          <div className="bg-blue-600 rounded-[40px] p-12 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            
            <h2 className="text-4xl font-bold mb-6">Ready to hire?</h2>
            <p className="text-xl mb-10 max-w-xl mx-auto opacity-90">
              Join thousands of companies finding their best talent on ZyncJobs. No credit card required to post your first job.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('employer-register')}
                className="bg-yellow-400 text-blue-900 px-10 py-5 rounded-xl font-bold hover:scale-105 transition-all shadow-xl"
              >
                Start Free Trial
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-xl font-bold hover:bg-white/20 transition-all">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-start max-w-7xl mx-auto gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="text-blue-600" />
              <span className="text-lg font-black text-slate-900">ZyncJobs</span>
            </div>
            <p className="text-sm text-slate-500">
              Revolutionizing the way India hires with intelligent matching and local market expertise.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 w-full md:w-auto">
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-slate-900">Product</p>
              <button onClick={() => onNavigate('job-posting')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Post Job</button>
              <button onClick={() => onNavigate('candidate-search')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Database</button>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-slate-900">Company</p>
              <button onClick={() => onNavigate('about')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">About Us</button>
              <button onClick={() => onNavigate('careers')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Careers</button>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-slate-900">Support</p>
              <button onClick={() => onNavigate('help')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Help Center</button>
              <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">API Docs</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-slate-900">Privacy</p>
              <button onClick={() => onNavigate('terms')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Terms</button>
              <button onClick={() => onNavigate('privacy')} className="text-slate-500 hover:text-blue-600 transition-colors text-left">Data Policy</button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 py-6 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">© 2024 ZyncJobs Global. All rights reserved.</p>
          <div className="flex gap-4">
            <Globe className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-600" />
            <Share2 className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-600" />
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-2 pt-2 md:hidden bg-white border-t border-slate-200 shadow-lg rounded-t-xl">
        <a className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 rounded-lg px-4 py-1" href="#solutions">
          <Briefcase className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Solutions</span>
        </a>
        <a className="flex flex-col items-center justify-center text-slate-500 px-4 py-1" href="#pricing">
          <CreditCard className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Pricing</span>
        </a>
        <button 
          onClick={() => onNavigate('employer-register')}
          className="flex flex-col items-center justify-center text-slate-500 px-4 py-1"
        >
          <Rocket className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Join Zync</span>
        </button>
      </nav>
    </div>
  );
};

export default EmployerLandingPage;