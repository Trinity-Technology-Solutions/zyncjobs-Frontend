import React from 'react';

export const Heading: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  level?: number;
}> = ({ children, className = '', level = 1 }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={`font-bold text-gray-900 ${className}`}>{children}</Tag>;
};

export const Paragraph: React.FC<{ 
  children: React.ReactNode; 
  smallMarginTop?: boolean;
}> = ({ children, smallMarginTop = false }) => {
  return (
    <p className={`text-gray-600 ${smallMarginTop ? 'mt-2' : 'mt-4'}`}>
      {children}
    </p>
  );
};

export const Link: React.FC<{ 
  children: React.ReactNode; 
  href: string;
}> = ({ children, href }) => {
  return (
    <a href={href} className="text-blue-600 hover:text-blue-700 underline">
      {children}
    </a>
  );
};

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {children}
    </span>
  );
};

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