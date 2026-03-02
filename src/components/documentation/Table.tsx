import React from 'react';

export const Table: React.FC<{ 
  table: any[][]; 
  className?: string;
  title?: string;
  tdClassNames?: string[];
  trClassNames?: string[];
}> = ({ table, className = '', title, tdClassNames = [], trClassNames = [] }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <table className="min-w-full border border-gray-200">
        <tbody>
          {table.map((row, rowIndex) => (
            <tr key={rowIndex} className={`border-b ${trClassNames[rowIndex] || ''}`}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={`px-3 py-2 border-r ${tdClassNames[cellIndex] || ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};