import React from "react";
import { cn } from "@/lib/utils";

interface BlurCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "solid";
}

export function BlurCard({ 
  children, 
  className, 
  variant = "glass",
  ...props 
}: BlurCardProps) {
  const variants = {
    default: "bg-card text-card-foreground border border-border shadow-sm",
    glass: "bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl text-white",
    solid: "bg-zinc-900 border border-zinc-800 text-zinc-100",
  };

  return (
    <div 
      className={cn(
        "rounded-xl transition-all duration-300", 
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}