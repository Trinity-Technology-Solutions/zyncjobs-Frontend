import React, { useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "I got a new, higher-paying job because a recruiter found me on ZyncJobs.",
      author: "John D.",
      role: "IT Analyst",
      rating: 5,
      backgroundImage: "/images/market.jpg",
      profileImage: "/images/AIpicture.jpg"
    },
    {
      quote: "Exceptionally easy. Impressive algorithm for suggesting related jobs.",
      author: "Jon A.",
      role: "Software Engineer", 
      rating: 5,
      backgroundImage: "/images/salary.jpg",
      profileImage: "/images/AIpicture.jpg"
    },
    {
      quote: "One of the best databases out there to find IT candidates.",
      author: "ASGN Inc",
      role: "Recruiting Team",
      rating: 5,
      backgroundImage: "/images/analyst.jpg",
      profileImage: "/images/AIpicture.jpg"
    }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes gentleFloat {
          0% { transform: rotateY(-8deg) rotateX(2deg) translateY(0px); }
          50% { transform: rotateY(8deg) rotateX(-2deg) translateY(-10px); }
          100% { transform: rotateY(-8deg) rotateX(2deg) translateY(0px); }
        }
        .floating-card {
          animation: gentleFloat 5s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .floating-card:nth-child(2) {
          animation-delay: -1.67s;
        }
        .floating-card:nth-child(3) {
          animation-delay: -3.33s;
        }
        .floating-card:nth-child(2) {
          animation-delay: 0s;
        }
        .floating-card:nth-child(3) {
          animation-delay: 0s;
        }
        .card-content:nth-child(2) {
          animation-delay: 0s;
        }
        .card-content:nth-child(3) {
          animation-delay: 0s;
        }
      `}</style>
      <section className="py-20 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Tech Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-500 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              See what tech professionals and employers are saying about ZyncJobs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
            {testimonials.map((testimonial, index) => (
              <InteractiveTestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

const InteractiveTestimonialCard = ({ testimonial }: { testimonial: any }) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div 
      ref={cardRef}
      className={`floating-card relative group bg-blue-50/80 backdrop-blur-lg rounded-3xl p-8 border border-blue-200/50 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer ${
        isHovered ? 'scale-105' : ''
      }`}
      style={{ transform, transformStyle: 'preserve-3d', perspective: '1000px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Glowing Border */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/30 via-blue-600/30 to-blue-400/30 blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Card Content */}
      <div className="relative z-10">
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            <div className="relative" style={{ transform: isHovered ? 'translateZ(30px)' : 'translateZ(0px)' }}>
              <img 
                src={testimonial.profileImage} 
                alt={testimonial.author}
                className="w-20 h-20 rounded-full object-cover border-4 border-white/50 shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/30 to-purple-400/30"></div>
            </div>
          </div>
          
          {/* Name */}
          <h3 className={`text-xl font-bold text-center mb-2 transition-colors duration-300 ${
            isHovered ? 'text-blue-600' : 'text-gray-800'
          }`} style={{ transform: isHovered ? 'translateZ(20px)' : 'translateZ(0px)' }}>
            {testimonial.author}
          </h3>
          <p className="text-blue-700 font-medium text-center mb-6" style={{ transform: isHovered ? 'translateZ(15px)' : 'translateZ(0px)' }}>
            {testimonial.role}
          </p>
          
          {/* Stars */}
          <div className="flex justify-center mb-6" style={{ transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)' }}>
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-blue-500 fill-current mx-0.5" />
            ))}
          </div>
          
          {/* Quote */}
          <Quote className="w-8 h-8 text-blue-600 mb-4 mx-auto" style={{ transform: isHovered ? 'translateZ(10px)' : 'translateZ(0px)' }} />
          <blockquote className="text-gray-800 text-center leading-relaxed italic" style={{ transform: isHovered ? 'translateZ(15px)' : 'translateZ(0px)' }}>
            "{testimonial.quote}"
          </blockquote>
      </div>
      
      {/* Highlight Glow */}
      <div className="absolute top-4 left-4 w-16 h-16 bg-blue-300/40 rounded-full blur-xl opacity-60"></div>
    </div>
  );
};

export default Testimonials;