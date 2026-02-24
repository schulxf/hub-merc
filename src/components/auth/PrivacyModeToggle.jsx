// src/components/auth/PrivacyModeToggle.jsx
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { usePrivacyMode } from '../../contexts/PrivacyContext';

/**
 * PrivacyModeToggle — eye icon button to toggle privacy mode.
 * Shows Eye when values are visible, EyeOff when values are masked.
 *
 * Must be rendered inside a PrivacyProvider tree.
 *
 * @returns {React.ReactElement}
 */
const PrivacyModeToggle = React.memo(function PrivacyModeToggle() {
  const { isPrivate, togglePrivacy } = usePrivacyMode();

  return (
    <button
      onClick={togglePrivacy}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      title={isPrivate ? 'Mostrar valores' : 'Ocultar valores'}
      aria-label={isPrivate ? 'Show values' : 'Hide values'}
    >
      {isPrivate ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  );
});

export default PrivacyModeToggle;
