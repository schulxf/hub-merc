/**
 * 🎨 Mercurius Design System - Reusable Components
 *
 * Collection of pre-styled components following the design system:
 * - Colors: #07090C bg, #0F1117 cards, #00FFEF cyan accent
 * - Typography: Figtree + JetBrains Mono
 * - Animations: GSAP-ready with transition classes
 */

import React from 'react';
import gsap from 'gsap';
import { ChevronRight, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   CARD COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const DesignCard = ({
  children,
  className = '',
  interactive = false,
  hoverGlow = false,
  ...props
}) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!interactive) return;

    const element = ref.current;
    if (!element) return;

    const onMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(element, {
        x: x * 0.05,
        y: y * 0.05,
        duration: 0.3,
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.3,
      });
    };

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseLeave);

    return () => {
      element.removeEventListener('mousemove', onMouseMove);
      element.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [interactive]);

  return (
    <div
      ref={ref}
      className={`
        card
        ${interactive ? 'cursor-pointer' : ''}
        ${hoverGlow ? 'hover:shadow-cyan hover:border-cyan/50' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BUTTON COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const PrimaryButton = ({
  children,
  className = '',
  magneticEffect = false,
  loading = false,
  disabled = false,
  onClick,
  ...props
}) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!magneticEffect) return;

    const button = ref.current;
    if (!button) return;

    const onMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        overwrite: 'auto',
      });
    };

    const onMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.3,
      });
    };

    button.addEventListener('mousemove', onMouseMove);
    button.addEventListener('mouseleave', onMouseLeave);

    return () => {
      button.removeEventListener('mousemove', onMouseMove);
      button.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [magneticEffect]);

  return (
    <button
      ref={ref}
      className={`
        btn btn-primary
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="animate-spin">⚙️</div>
      ) : (
        children
      )}
    </button>
  );
};

export const SecondaryButton = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        btn btn-secondary
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ALERT/NOTIFICATION COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const Alert = ({
  type = 'info', // 'info', 'success', 'warning', 'error'
  title,
  message,
  onClose,
  closeable = true,
  className = '',
}) => {
  const typeConfig = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: Info,
      color: 'text-blue-400',
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: CheckCircle2,
      color: 'text-green-400',
    },
    warning: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      icon: AlertCircle,
      color: 'text-orange-400',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: XCircle,
      color: 'text-red-400',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        animate-slide-in-down
        ${config.bg} border ${config.border}
        rounded-lg p-4 flex gap-4 items-start
        ${className}
      `}
    >
      <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <h3 className={`font-bold ${config.color}`}>{title}</h3>}
        {message && (
          <p className="text-sm text-text-secondary mt-1">{message}</p>
        )}
      </div>
      {closeable && onClose && (
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   INPUT COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const TextInput = ({
  label,
  placeholder,
  icon: Icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
        )}
        <input
          type="text"
          placeholder={placeholder}
          className={`
            input
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-2 flex items-center gap-1">
          <XCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export const SelectInput = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <select
        className={`
          input appearance-none
          ${error ? 'border-red-500' : ''}
        `}
        {...props}
      >
        <option value="">Selecione uma opção</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BADGE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const Badge = ({
  children,
  type = 'default', // 'default', 'success', 'warning', 'error', 'cyan'
  className = '',
}) => {
  const typeConfig = {
    default: 'bg-bg-tertiary text-text-primary border-border',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    cyan: 'bg-cyan-dim text-cyan border-cyan/20',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1 rounded-full text-xs font-medium
        border ${typeConfig[type]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADER COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const SkeletonCard = ({ className = '' }) => (
  <div className={`card animate-pulse ${className}`}>
    <div className="h-6 bg-bg-quaternary rounded w-3/4 mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-bg-quaternary rounded w-full" />
      <div className="h-4 bg-bg-quaternary rounded w-5/6" />
      <div className="h-4 bg-bg-quaternary rounded w-4/6" />
    </div>
  </div>
);

export const SkeletonLine = ({ className = '' }) => (
  <div className={`h-4 bg-bg-quaternary rounded animate-pulse ${className}`} />
);

/* ═══════════════════════════════════════════════════════════════════
   DIVIDER COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const Divider = ({ className = '' }) => (
  <div className={`h-px bg-border ${className}`} />
);

export const DividerWithLabel = ({ label, className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
      {label}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   STAT COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const StatCard = ({
  label,
  value,
  unit = '',
  change = null,
  changeType = 'positive', // 'positive', 'negative', 'neutral'
  icon: Icon,
  className = '',
}) => {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-text-secondary',
  };

  return (
    <DesignCard className={`flex items-start justify-between ${className}`}>
      <div className="flex-1">
        <p className="text-text-tertiary text-sm font-medium mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {unit && <span className="text-text-secondary text-sm">{unit}</span>}
        </div>
        {change !== null && (
          <p className={`text-xs mt-2 ${changeColor[changeType]}`}>
            {changeType === 'positive' && '↑'}
            {changeType === 'negative' && '↓'}
            {' '}{change}
          </p>
        )}
      </div>
      {Icon && (
        <div className="w-12 h-12 bg-cyan-dim rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-cyan" />
        </div>
      )}
    </DesignCard>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MODAL/OVERLAY COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md', // 'sm', 'md', 'lg'
}) => {
  if (!isOpen) return null;

  const sizeConfig = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-modal">
      <div
        className={`
          bg-bg-tertiary border border-border rounded-lg
          ${sizeConfig[size]} w-full mx-4
          animate-slide-in-up
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {actions && (
          <div className="flex gap-3 p-6 border-t border-border justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

export const PageHeader = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-black text-text-primary mb-2">{title}</h1>
          {subtitle && (
            <p className="text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export const Section = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-text-primary mb-6">{title}</h2>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default {
  DesignCard,
  PrimaryButton,
  SecondaryButton,
  Alert,
  TextInput,
  SelectInput,
  Badge,
  SkeletonCard,
  SkeletonLine,
  Divider,
  DividerWithLabel,
  StatCard,
  Modal,
  PageHeader,
  Section,
};
