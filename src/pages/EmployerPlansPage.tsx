import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, Building2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Props { onNavigate: (page: string) => void; user?: any; onLogout?: () => void; }
export default function EmployerPlansPage({ onNavigate, user, onLogout }: Props) {
  const navigate = useNavigate();
  return <div className="hiring-plans-page min-h-screen">
    <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
    <div className="portal-page-container hiring-plans-back"><button type="button" onClick={() => navigate('/employers')}><ArrowLeft size={16} />Back to employer home</button></div>
      <section id="hiring-plans" className="employer-public-plans">
        <div className="portal-page-container">
          <div className="hiring-plans-page-heading"><span>HIRING PLANS</span><h1>Hiring options for every team</h1><p>Compare the tools your team needs. Request pricing tailored to your hiring volume before creating an account.</p></div>
          <div className="public-hiring-plan-grid">
            {[
              { icon: Briefcase, title: 'Job posting', description: 'For teams ready to advertise open roles and manage incoming applications.', features: ['Publish your open roles', 'Review applicants by job', 'Manage application stages'] },
              { icon: Search, title: 'Candidate sourcing', description: 'For recruiters who want to find and connect with candidates directly.', features: ['Search candidate profiles', 'Filter by skills and experience', 'Review profiles and contact candidates'] },
              { icon: Building2, title: 'Team hiring', description: 'Discuss a hiring setup for multiple recruiters, roles or ongoing recruitment.', features: ['Discuss your team requirements', 'Choose the tools you need', 'Request a tailored quote'] },
            ].map(({icon: Icon, title, description, features}) => <article key={title} className="public-hiring-plan">
              <div className="public-plan-icon"><Icon size={24} aria-hidden="true" /></div>
              <h3>{title}</h3><p>{description}</p>
              <ul>{features.map(feature => <li key={feature}><CheckCircle2 size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className="public-plan-pricing">Pricing on request<span>Our team will confirm pricing and availability.</span></div>
              <button type="button" onClick={() => navigate('/employers#request-callback')}>Request pricing <ArrowRight size={16} aria-hidden="true" /></button>
            </article>)}
          </div>
          <p className="public-plans-note">You can explore these options without signing in. An employer account is needed to post jobs and use recruiter tools.</p>
        </div>
      </section>
    <Footer onNavigate={onNavigate} user={user} />
  </div>;
}
