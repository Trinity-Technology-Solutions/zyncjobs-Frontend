import { ArrowRight } from 'lucide-react';

interface GradientCardProps {
  badgeText: string;
  badgeColor?: string;
  title: string;
  description: string;
  ctaText: string;
  icon?: React.ReactNode;
  gradient?: 'blue' | 'orange' | 'purple' | 'green' | 'cyan' | 'yellow' | 'teal' | 'pink';
  featured?: boolean;
  chips?: string[];
  onClick?: () => void;
}

const gradientStyles: Record<NonNullable<GradientCardProps['gradient']>, { bg: string; accent: string }> = {
  blue: { bg: 'from-blue-600 to-indigo-700', accent: 'text-blue-400' },
  orange: { bg: 'from-orange-600 to-pink-700', accent: 'text-orange-400' },
  purple: { bg: 'from-violet-600 to-purple-700', accent: 'text-violet-400' },
  green: { bg: 'from-emerald-600 to-teal-700', accent: 'text-emerald-400' },
  cyan: { bg: 'from-cyan-500 to-blue-700', accent: 'text-cyan-400' },
  yellow: { bg: 'from-amber-500 to-orange-700', accent: 'text-amber-400' },
  teal: { bg: 'from-teal-600 to-emerald-700', accent: 'text-teal-400' },
  pink: { bg: 'from-pink-600 to-rose-700', accent: 'text-pink-400' },
};

export default function GradientCard({
  badgeText,
  badgeColor = '#F59E0B',
  title,
  description,
  ctaText,
  icon,
  gradient = 'orange',
  featured = false,
  chips,
  onClick,
}: GradientCardProps) {
  const { bg, accent } = gradientStyles[gradient];

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-900 shadow-lg shadow-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${featured ? 'p-6 sm:p-7' : 'p-5 sm:p-6'} ${onClick ? '' : 'cursor-default'}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-15 group-hover:opacity-25 transition-opacity duration-300`} />
      {icon && (
        <div className={`absolute -right-4 -top-4 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ${featured ? 'w-24 h-24' : 'w-20 h-20'}`}>
          <div className={`flex items-center justify-center text-white/70 ${featured ? 'w-16 h-16' : 'w-14 h-14'}`}>
            <div className={featured ? 'w-8 h-8' : 'w-7 h-7'}>{icon}</div>
          </div>
        </div>
      )}
      <div className="relative flex flex-col flex-1">
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{ color: badgeColor, borderColor: `${badgeColor}40`, background: `${badgeColor}15` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: badgeColor }} />
          {badgeText}
        </span>
        <h3 className={`mt-3 font-bold text-white leading-tight ${featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>{title}</h3>
        <p className={`mt-1.5 text-gray-400 leading-relaxed ${featured ? 'text-xs sm:text-sm max-w-md' : 'text-xs sm:text-sm'}`}>{description}</p>
        {chips && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[11px] text-gray-300">
                {chip}
              </span>
            ))}
          </div>
        )}
        <span className={`mt-auto pt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold ${accent} group-hover:gap-3.5 transition-all duration-300`}>
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}