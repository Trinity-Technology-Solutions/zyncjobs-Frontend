"use client" 

import * as React from "react"

import { useMeasure } from "@uidotdev/usehooks"
import { VariantProps, cva } from "class-variance-authority"
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "../../utils/cn"

const processCardVariants = cva("flex border backdrop-blur-lg", {
  variants: {
    variant: {
      indigo:
        "flex border text-slate-50 border-slate-700 backdrop-blur-lg bg-gradient-to-br from-[rgba(15,23,42,0.7)_40%] to-[#3730a3_120%]",
      light: "shadow",
    },
    size: {
      sm: "min-w-[25%] max-w-[25%]",
      md: "min-w-[50%] max-w-[50%]",
      lg: "min-w-[75%] max-w-[75%]",
      xl: "min-w-full max-w-full",
    },
  },
  defaultVariants: {
    variant: "indigo",
    size: "md",
  },
})
interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>
}
interface ProcessCardProps
  extends HTMLMotionProps<"div">,
    VariantProps<typeof processCardVariants> {
  itemsLength: number
  index: number
}

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined)
function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext)
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScroll Component"
    )
  }
  return context
}
export const ContainerScroll = ({
  children,
  className,
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"]
  })
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-[300vh]", className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  )
}
export const ContainerSticky = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("sticky left-0 top-0 w-full overflow-hidden", className)}
    {...props}
  />
))
ContainerSticky.displayName = "ContainerSticky"

export const ProcessCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
ProcessCardTitle.displayName = "ProcessCardTitle"

export const ProcessCardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-8 p-6", className)}
    {...props}
  />
))
ProcessCardBody.displayName = "ProcessCardBody"

export const ProcessCard: React.FC<ProcessCardProps> = ({
  className,
  style,
  variant,
  size,
  itemsLength,
  index,
  ...props
}) => {
  const { scrollYProgress } = useContainerScrollContext()
  const chunk = 1 / Math.max(1, itemsLength - 1)
  const start = (index - 1) * chunk
  const end = index * chunk

  const [ref] = useMeasure()

  const x = useTransform(scrollYProgress, (progress) => {
    // Stack offset (e.g., 20px per card)
    const offset = window.innerWidth < 768 ? 15 : 30;
    const targetX = offset * index;
    
    // Card 0 always stays at 0
    if (index === 0) return 0;
    
    // Before its turn, it's offscreen to the right
    if (progress <= start) return window.innerWidth;
    // After its turn, it's fully stacked
    if (progress >= end) return targetX;
    
    // During its turn, interpolate
    const t = (progress - start) / (end - start);
    return window.innerWidth + t * (targetX - window.innerWidth);
  })
  
  return (
    <motion.div
      ref={ref}
      style={{
        x: index > 0 ? x : 0,
        // Add zIndex so later cards stack on top
        zIndex: index,
        ...style,
      }}
      className={cn(processCardVariants({ variant, size }), "absolute", className)}
      {...props}
    />
  )
}
ProcessCard.displayName = "ProcessCard"
