import React, { forwardRef, InputHTMLAttributes, LabelHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  labelClassName?: string;
  className?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, labelClassName, className = '', indeterminate, id, disabled, required, checked, onChange, ...props }, ref) => {
    const generatedId = `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    const checkboxId = id || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
    };

    return (
      <div className={`checkbox-wrapper ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          required={required}
          checked={checked}
          onChange={handleChange}
          aria-checked={indeterminate ? 'mixed' : checked}
          className="checkbox-input"
          {...props}
        />
        <span
          className="checkbox-box"
          aria-hidden="true"
        >
          {checked && (
            <svg className="checkbox-checkmark" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.3333 4.66667L5.66667 12.3333L2.66667 9.33333"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {indeterminate && !checked && (
            <svg className="checkbox-checkmark" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="7.5" width="10" height="1" rx="0.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </span>
        {label && (
          <label
            htmlFor={checkboxId}
            className={`checkbox-label ${labelClassName || ''}`}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  labelClassName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
  md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 'translate-x-6' },
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, labelClassName, className = '', size = 'md', id, disabled, required, checked, onChange, ...props }, ref) => {
    const generatedId = `toggle-${Math.random().toString(36).slice(2, 9)}`;
    const toggleId = id || generatedId;
    const s = sizeClasses[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
    };

    return (
      <div className={`toggle-wrapper ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          disabled={disabled}
          required={required}
          checked={checked}
          onChange={handleChange}
          className="toggle-input"
          {...props}
        />
        <span
          className={`toggle-track ${s.track}`}
          aria-hidden="true"
        >
          <span
            className={`toggle-thumb ${s.thumb} ${checked ? s.translate : ''}`}
          />
        </span>
        {label && (
          <label
            htmlFor={toggleId}
            className={`toggle-label ${labelClassName || ''}`}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default { Checkbox, Toggle };