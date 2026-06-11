import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const baseStyle = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300";
  
  const variants = {
    default: "bg-chip text-chip border-outline/30",
    success: "bg-success/15 text-success border-success/35 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    warning: "bg-warning/15 text-warning border-warning/35 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    danger: "bg-danger/15 text-danger border-danger/35 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    purple: "bg-[var(--neon-purple)]/15 text-[var(--neon-purple)] border-[var(--neon-purple)]/35 shadow-[0_0_10px_rgba(168,85,247,0.15)]",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
