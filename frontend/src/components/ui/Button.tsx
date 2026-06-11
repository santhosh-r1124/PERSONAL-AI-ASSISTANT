import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-r from-[var(--neon-purple)] to-[var(--accent-light)] text-white hover:brightness-110 shadow-[0_4px_14px_0_var(--neon-purple-glow)] hover:shadow-[0_6px_20px_0_var(--neon-purple-glow)] border border-[var(--neon-purple)]/20",
    secondary:
      "bg-elevated/80 text-foreground border border-outline/50 hover:bg-elevated hover:border-outline/80",
    danger:
      "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 hover:border-danger/50 shadow-[0_4px_12px_rgba(239,68,68,0.15)]",
    ghost:
      "text-muted hover:text-foreground hover:bg-elevated/40 border border-transparent",
    glass:
      "backdrop-blur-md bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
