import React from "react";

export default function WorkButton({
  text = "Work with us",
  onClick,
  className = "",
  type = "button",
  disabled = false,
  size = "lg",
  rounded = "rounded-full",
  icon,
}: {
  text?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  rounded?: string;
  icon?: React.ReactNode;
}) {
  const sizeClasses = {
    sm: "h-9 px-4 text-xs font-semibold",
    md: "h-11 px-6 text-sm font-semibold",
    lg: "h-12 px-7 text-[15px] sm:text-base font-semibold",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group/work relative inline-flex items-center justify-center gap-2 overflow-hidden ${rounded} bg-gradient-to-r from-orange-600 via-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white ${sizeClasses[size]} shadow-md shadow-orange-600/20 hover:shadow-lg hover:shadow-orange-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${className}`}
    >
      <span className="absolute bottom-0 left-0 h-48 w-full origin-bottom translate-y-full transform overflow-hidden rounded-full bg-white/20 transition-transform duration-300 ease-out group-hover/work:translate-y-14" />
      {icon && <span className="relative z-10 transition-transform duration-200 group-hover/work:scale-105">{icon}</span>}
      <span className="relative z-10 font-semibold tracking-tight">{text}</span>
    </button>
  );
}