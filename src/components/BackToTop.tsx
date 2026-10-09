import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasChatButton, setHasChatButton] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(currentScrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkChat = () => {
      const chatBtn = document.getElementById('zync-chat-button');
      const chatWin = document.getElementById('zync-chat-window');
      setHasChatButton(!!chatBtn);
      setIsChatOpen(!!chatWin);
    };

    checkChat();
    const observer = new MutationObserver(checkChat);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const shouldShow = isVisible && !isChatOpen;
  const positionClasses = hasChatButton
    ? 'bottom-[72px] right-4 sm:bottom-[84px] sm:right-6'
    : 'bottom-4 right-4 sm:bottom-6 sm:right-6';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className={`group fixed ${positionClasses} z-[9998] flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-[#102a43] hover:text-blue-600 hover:border-blue-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 ${
        shouldShow
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={2.25} />
      
      {/* Tooltip for desktop hover */}
      <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 text-white px-2.5 py-1 text-xs font-medium shadow-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden sm:block">
        Back to top
      </span>
    </button>
  );
};

export default BackToTop;
