export default function WorkButton({
  text = "Work with us",
  onClick,
  className = "",
  type = "button",
  disabled = false,
  size = "lg",
}: {
  text?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-10 px-5 py-2 text-sm",
    md: "h-12 px-8 py-3 text-base",
    lg: "px-14 py-4 text-lg",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group/work relative overflow-hidden rounded-full bg-orange-600 ${sizeClasses[size]} transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="absolute bottom-0 left-0 h-48 w-full origin-bottom translate-y-full transform overflow-hidden rounded-full bg-white/15 transition-transform duration-300 ease-out group-hover/work:translate-y-14"></span>
      <span className="font-semibold text-orange-50">{text}</span>
    </button>
  );
}