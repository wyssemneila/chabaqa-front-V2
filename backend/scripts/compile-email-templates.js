const fs = require('fs');
const path = require('path');
const mjml2html = require('mjml');

const root = path.resolve(__dirname, '..');
const templateRoot = path.join(root, 'src', 'domains', 'communication', 'email-templates');
const sourceRoot = path.join(templateRoot, 'mjml');
const outputRoot = path.join(templateRoot, 'compiled');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

async function compileTemplate(sourcePath) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  const outputPath = path.join(outputRoot, relativePath.replace(/\.mjml\.hbs$/, '.hbs'));
  const source = fs.readFileSync(sourcePath, 'utf8');
  const result = await mjml2html(source, {
    beautify: true,
    filePath: sourcePath,
    minify: false,
    validationLevel: 'strict',
  });

  if (result.errors.length > 0) {
    const formattedErrors = result.errors
      .map((error) => `${error.line}:${error.message}`)
      .join('\n');
    throw new Error(`Failed to compile ${relativePath}\n${formattedErrors}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.html, 'utf8');
  return outputPath;
}

const templates = walk(sourceRoot).filter((filePath) => filePath.endsWith('.mjml.hbs'));

if (templates.length === 0) {
  throw new Error(`No MJML templates found in ${sourceRoot}`);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
Promise.all(templates.map(compileTemplate))
  .then((compiled) => {
    console.log(`Compiled ${compiled.length} email template(s) to ${path.relative(root, outputRoot)}`);
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
