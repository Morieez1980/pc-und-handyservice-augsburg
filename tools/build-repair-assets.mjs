import {readFile, writeFile} from 'node:fs/promises';
for (const name of ['repair-form.js', 'request.css']) {
  const source = await readFile(new URL('../' + name, import.meta.url), 'utf8');
  // Preserve line breaks and strings; remove only indentation and blank lines.
  const compact = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join('\n') + '\n';
  await writeFile(new URL('../' + name.replace(/\.(js|css)$/, '.min.$1'), import.meta.url), compact);
}
