// Generates PDFs using the real Resume Builder component and verifies extractable text.
// Synthetic fixture only; no backend, AI provider, or candidate data is used.
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { build, transform } from 'esbuild';
import ts from 'typescript';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const directory = path.resolve('.tmp-resume-roundtrip');
const modulePath = path.join(directory, 'ResumeBuilder.mjs');
const parserPath = path.join(directory, 'ResumeParser.mjs');
await fs.mkdir(directory, { recursive: true });
try {
  const compiled = await build({ entryPoints: ['src/components/resume-builder/ResumePDFDocument.tsx'], bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false });
  await fs.writeFile(modulePath, compiled.outputFiles[0].contents);
  const { default: ResumeDocument } = await import(pathToFileURL(modulePath).href);
  const parserSource = await fs.readFile('src/components/resume-parser/parseLogic.ts', 'utf8');
  const localParser = parserSource.slice(0, parserSource.indexOf('export type AIParseStatus'))
    .replace(/^import .*;\r?$/gm, '')
    .replace(/^const API_BASE_URL = .*;\r?$/m, "const API_BASE_URL = '/api';");
  const pageSource = await fs.readFile('src/components/resume-parser/page.tsx', 'utf8');
  const ast = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const converter = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'convertTextItemsToText');
  assert.ok(converter, 'Use the actual standalone parser PDF layout converter');
  const compiledParser = await transform(localParser + '\n' + converter.getText(ast) + '\nexport { parseResumeLocally, convertTextItemsToText };', { loader: 'ts', format: 'esm', target: 'es2022' });
  await fs.writeFile(parserPath, compiledParser.code);
  const { parseResumeLocally, convertTextItemsToText } = await import(pathToFileURL(parserPath).href);
  const fixture = {
    personalInfo: { name: 'Resume Compatibility Test', email: 'compatibility@example.com', phone: '+91 9876543210', location: 'Chennai', linkedin: '', portfolio: '' },
    summary: 'Software developer building reliable web applications and services.',
    experience: [{ id: 'experience', title: 'Software Developer', company: 'Example Company', location: 'Chennai', duration: '2024 - Present', current: true, bullets: ['Developed web applications using React and TypeScript.'] }],
    education: [{ id: 'education', level: 'ug', degree: 'B.Tech', institution: 'Example University', duration: '2020 - 2024', grade: '8.5' }],
    skills: ['React', 'TypeScript', 'Python'],
    projects: [{ id: 'project', name: 'Portfolio', role: 'Developer', duration: '2024', url: '', bullets: ['Built a responsive portfolio with accessible navigation.'] }],
    certifications: [{ id: 'certificate', name: 'Cloud Foundations', issuer: 'Example Academy', year: '2024' }],
    awards: [], languages: [], achievements: [], customSections: [], hiddenSections: [],
  };
  for (const template of ['classic', 'modern', 'minimal', 'executive', 'compact', 'professional']) {
    const blob = await pdf(React.createElement(ResumeDocument, { data: { ...fixture, template } })).toBlob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
    const task = pdfjs.getDocument({ data: bytes, standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/', useSystemFonts: false });
    try {
      const document = await task.promise;
      const text = [];
      const textItems = [];
      for (let page = 1; page <= document.numPages; page++) {
        const content = await (await document.getPage(page)).getTextContent();
        text.push(...content.items.filter(item => 'str' in item).map(item => item.str));
        textItems.push(...content.items.filter(item => 'str' in item && item.str.trim()).map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], page })));
      }
      const extracted = text.join(' ');
      assert.ok(extracted.includes('compatibility@example.com'), `${template}: email must be extractable`);
      assert.ok(extracted.includes('Software Developer'), `${template}: role must be extractable`);
      assert.ok(extracted.includes('Portfolio'), `${template}: project must be extractable`);
      assert.ok(extracted.includes('Cloud Foundations'), `${template}: certification must be extractable`);
      const parsed = parseResumeLocally(convertTextItemsToText(textItems));
      assert.equal(parsed.profile.email, 'compatibility@example.com', `${template}: standalone parser must read the Builder contact`);
      assert.ok(parsed.skills.featuredSkills.some(item => item.skill === 'React'), `${template}: standalone parser must populate skills`);
      console.log(`${template}: Builder PDF -> extraction -> standalone parser passed (${document.numPages} pages)`);
    } finally { await task.destroy(); }
  }
} finally {
  await fs.unlink(modulePath).catch(() => {});
  await fs.unlink(parserPath).catch(() => {});
  await fs.rmdir(directory).catch(() => {});
}
