/**
 * 🎨 Dashboard Button Components
 *
 * Standardized buttons for the entire dashboard with design system consistency.
 * All buttons use GSAP for smooth interactions and magnetic effects.
 */

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Primary Button - Main CTAs (Cyan accent)
 * Used for: Create, Save, Submit, Confirm
 */
export const DashboardPrimaryButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled || loading) return;

    const btn = ref.current;
    if (!btn) return;

    const onMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.3,
      });
    };

    btn.addEventListener('mousemove', onMouseMove);
    btn.addEventListener('mouseleave', onMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', onMouseMove);
      btn.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [disabled, loading]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-4 py-2.5 rounded-lg
        bg-cyan text-bg font-bold
        transition-normal
        shadow-cyan hover:shadow-md-glow
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-cyan/50
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-transparent border-t-bg rounded-full animate-spin" />
          Processando...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Secondary Button - Alternative actions (Bordered)
 * Used for: Cancel, Skip, Alternative options
 */
export const DashboardSecondaryButton = ({
  children,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return;

    const btn = ref.current;
    if (!btn) return;

    const onMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.3,
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.3,
      });
    };

    btn.addEventListener('mousemove', onMouseMove);
    btn.addEventListener('mouseleave', onMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', onMouseMove);
      btn.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [disabled]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-lg
        bg-bg-tertiary text-text-primary
        border border-white/[0.08]
        font-medium
        transition-normal
        hover:bg-bg-quaternary hover:border-white/[0.15]
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-cyan/50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Ghost Button - Minimal style
 * Used for: Links, Less important actions
 */
export const DashboardGhostButton = ({
  children,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-lg
        bg-transparent text-text-secondary
        font-medium
        transition-fast
        hover:text-text-primary hover:bg-bg-quaternary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-cyan/50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Icon Button - Square buttons for icons only
 * Used for: Add, Delete, Edit, Close
 */
export const DashboardIconButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'secondary', // 'primary', 'secondary', 'ghost'
  className = '',
  ...props
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return;

    const btn = ref.current;
    if (!btn) return;

    const onMouseEnter = () => {
      gsap.to(btn, {
        scale: 1.1,
        duration: 0.2,
      });
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.2,
      });
    };

    btn.addEventListener('mouseenter', onMouseEnter);
    btn.addEventListener('mouseleave', onMouseLeave);

    return () => {
      btn.removeEventListener('mouseenter', onMouseEnter);
      btn.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [disabled]);

  const variantClasses = {
    primary: 'bg-cyan text-bg hover:bg-cyan shadow-cyan',
    secondary: 'bg-bg-tertiary text-text-primary border border-white/[0.08] hover:bg-bg-quaternary hover:border-white/[0.15]',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-quaternary/50',
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-lg
        flex items-center justify-center
        transition-normal
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-cyan/50
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Tag/Badge Button - Pill-shaped, smaller
 * Used for: Filters, Categories, Status badges
 */
export const DashboardTagButton = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-full
        text-xs font-medium
        transition-fast
        ${active
          ? 'bg-cyan text-bg shadow-cyan'
          : 'bg-bg-tertiary text-text-secondary border border-border hover:border-cyan/50'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-cyan/50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Group Button - Buttons grouped together
 * Used for: Toggle groups, Multi-action areas
 */
export const DashboardButtonGroup = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex gap-1 rounded-lg bg-bg-tertiary p-1 ${className}`}>
      {children}
    </div>
  );
};

export const DashboardGroupButton = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-md
        text-sm font-medium
        transition-fast
        ${active
          ? 'bg-bg-quaternary text-cyan shadow-sm'
          : 'text-text-secondary hover:text-text-primary'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-1 focus:ring-cyan/50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Danger Button - For destructive actions
 * Used for: Delete, Remove, Clear
 */
export const DashboardDangerButton = ({
  children,
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-lg
        bg-red-500/20 text-red-400
        border border-red-500/30
        font-medium
        transition-normal
        hover:bg-red-500/30 hover:border-red-500/50
        shadow-md hover:shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none focus:ring-2 focus:ring-red-500/50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default {
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardGhostButton,
  DashboardIconButton,
  DashboardTagButton,
  DashboardButtonGroup,
  DashboardGroupButton,
  DashboardDangerButton,
};
