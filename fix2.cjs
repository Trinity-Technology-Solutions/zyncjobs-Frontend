const fs = require('fs');
const path = 'c:/Users/muthe/Downloads/zyncjobs-Frontend/src/pages/CandidateDashboardPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// The patch incorrectly wrapped <Edit .../> inside buttons like:
// {!readOnly && (<Edit className="w-5 h-5 text-blue-600" />
// <span className="text-gray-700">Settings</span>
// This breaks JSX. We need to revert these - just remove the {!readOnly && ( wrapper
// and keep the Edit icon as-is (it's inside a button so it's fine to always show,
// the whole sidebar is already hidden by the outer !readOnly wrapper)

// Fix pattern: {!readOnly && (<Edit className="w-5 h-5 text-blue-600" />\n
// followed by <span ...> - revert to just <Edit className="w-5 h-5 text-blue-600" />
c = c.replace(/\{!readOnly && \(<Edit className="w-5 h-5 text-blue-600" \/>\n/g, '<Edit className="w-5 h-5 text-blue-600" />\n');

// Also fix standalone Edit icons that were wrapped (in section headers outside sidebar)
// Pattern: {!readOnly && (<Edit \n...onClick=...\n.../>\n)}
// These are the pencil edit icons next to section titles - revert them too
// since the whole modals section is already gated by !readOnly
c = c.replace(/\{!readOnly && \(<Edit \n(\s+onClick=\{[^}]+\}\n\s+className="[^"]+"\s*\/>\n\s*)\)\}/g, 
  '<Edit \n$1/>');

// Fix any remaining {!readOnly && (<Edit ... />)} single-line patterns  
c = c.replace(/\{!readOnly && \(<Edit ([^/]+)\/>\)\}/g, '<Edit $1/>');

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed Edit icons. Size:', c.length);
