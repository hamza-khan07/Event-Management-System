import React from 'react';

const StatCard = ({ title, count, colorClass }) => {
    return (
        <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</p>
            <p className={`text-xl font-bold mt-1 ${colorClass}`}>{count}</p>
        </div>
    );
};

export default StatCard;
