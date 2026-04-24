const fs = require('fs');

const origPath = 'd:/grad project/Graduation-project/src/pages/developer/dashboard/DevProfile.jsx';
const correctPath = 'd:/grad project/Graduation-project/src/pages/developer/dashboard/DevProfile.jsx.correct';

const origContent = fs.readFileSync(origPath, 'utf8');
const correctContent = fs.readFileSync(correctPath, 'utf8');

const origLines = origContent.split(/\r?\n/);
const first636 = origLines.slice(0, 636).join('\n');

const combined = first636 + '\n' + correctContent;

fs.writeFileSync(origPath, combined);
console.log('File combined successfully');
console.log('Total lines:', combined.split(/\r?\n/).length);
