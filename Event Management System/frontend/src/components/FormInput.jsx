// src/components/FormInput.jsx
import React from 'react';

/**
 * Reusable form input component with label, styled input, and error states.
 */
const FormInput = ({ label, type, name, placeholder, value, onChange, disabled }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    );
};

export default FormInput;
