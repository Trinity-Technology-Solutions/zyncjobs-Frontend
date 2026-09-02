import React, { type ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface TimelineStep {
  description: string;
  icon: ReactNode;
  title: string;
}

interface Timeline2Props {
  className?: string;
  description?: string;
  steps?: TimelineStep[];
  title?: string;
}

const defaultSteps: TimelineStep[] = [
  {
    icon: "I",
    title: "Design",
    description: "Plan your layout and pick your blocks.",
  },
  {
    icon: "II",
    title: "Develop",
    description: "Install components and wire them up.",
  },
  {
    icon: "III",
    title: "Test",
    description: "Check responsiveness and dark mode.",
  },
  {
    icon: "IV",
    title: "Deploy",
    description: "Push to production. Game over (in a good way).",
  },
];

export default function Timeline2({
  title = "The Quest Line",
  description = "Your path from idea to launch",
  steps = defaultSteps,
  className,
}: Timeline2Props) {
  return (
    <section className={cn("w-full px-4 py-16", className)}>
      <div className="mx-auto max-w-5xl">
        {(title || description) && (
          <div className="mb-16 text-center">
            {title && (
              <h2 className="mb-3 font-bold text-3xl tracking-tight md:text-4xl text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-500 text-lg">{description}</p>
            )}
          </div>
        )}

        {/* Horizontal on desktop, vertical on mobile */}
        <div className="relative flex flex-col gap-12 md:flex-row md:gap-0">
          {/* Horizontal line (desktop) */}
          <div className="absolute top-7 right-0 left-0 hidden h-0 border-t-2 border-dashed border-gray-300 md:block" />

          {steps.map((step, i) => (
            <div
              className="relative flex flex-1 flex-col items-center text-center"
              key={step.title}
            >
              {/* Checkpoint */}
              <div className="relative z-10 mb-6 flex size-14 items-center justify-center rounded-xl border-2 border-gray-900 bg-white shadow-[4px_4px_0_0_rgba(17,24,39,1)] font-bold text-gray-900 text-xl">
                {step.icon}
              </div>

              <h3 className="mb-2 font-bold text-xl text-gray-900">{step.title}</h3>
              <p className="max-w-[200px] text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
