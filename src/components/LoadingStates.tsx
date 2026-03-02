import React from 'react';
import { Loader2, Search, Briefcase, User, MessageCircle } from 'lucide-react';

// Spinner Loading Component
export const Spinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Button Loading State
export const LoadingButton = ({ 
  loading, 
  children, 
  className = '', 
  loadingText = 'Loading...',
  ...props 
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  [key: string]: any;
}) => {
  return (
    <button 
      {...props}
      disabled={loading || props.disabled}
      className={`flex items-center justify-center space-x-2 ${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading && <Spinner size="sm" />}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
};

// Job Card Skeleton
export const JobCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-20 ml-4"></div>
          </div>
          
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
          
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>

          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        </div>

        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

// Search Loading State
export const SearchLoading = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-blue-600">
        <Search className="w-5 h-5 animate-pulse" />
        <span className="text-lg font-medium">Searching jobs...</span>
        <Spinner size="md" />
      </div>
    </div>
  );
};

// Chat Loading (Typing Indicator)
export const ChatTyping = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page Loading Overlay
export const PageLoading = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="text-blue-600 mb-4" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

// AI Analysis Loading
export const AIAnalysisLoading = ({ message = 'Analyzing with AI...' }: { message?: string }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <Briefcase className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-lg font-medium text-gray-700 mb-2">{message}</p>
        <p className="text-sm text-gray-500">This may take a few moments...</p>
      </div>
    </div>
  );
};

// Profile Loading
export const ProfileLoading = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

// Form Loading Overlay
export const FormLoading = ({ message = 'Processing...' }: { message?: string }) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
      <div className="flex items-center space-x-3">
        <Spinner size="md" className="text-blue-600" />
        <span className="text-gray-700 font-medium">{message}</span>
      </div>
    </div>
  );
};