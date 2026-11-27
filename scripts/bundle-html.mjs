// Packs the production build into one self-contained .html file that runs
// straight off the filesystem (no server, no install, no network).
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const htmlPath = path.join(dist, 'index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

const assetsDir = path.join(dist, 'assets')
const assets = fs.readdirSync(assetsDir)
const jsFile = assets.find((f) => f.endsWith('.js'))
const cssFile = assets.find((f) => f.endsWith('.css'))
if (!jsFile) throw new Error('no js bundle found')

const js = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8')
let css = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf8') : ''

// strip network font imports so the file is fully offline
css = css.replace(/@import\s+url\(['"]?https?:\/\/[^)]*\)\s*;?/g, '')

// drop external <link> tags (fonts, preconnect, stylesheet) and swap them for inline styles
html = html.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, '')
html = html.replace(/<link[^>]*rel="preconnect"[^>]*>/g, '')
// NB: always use a replacer function — a replacement string would interpret
// $&, $1, $' inside the bundled source and corrupt it.
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, () => `<style>\n${css}\n</style>`)

if (!/<script[^>]*src="/.test(html)) throw new Error('no script tag to inline')
html = html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, () => `<script type="module">\n${js}\n</script>`)

html = html.replace('<title>', () => '<!-- Standalone build: open this file in any browser -->\n    <title>')

const out = path.resolve('starmaker.html')
fs.writeFileSync(out, html)
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`)

// GitHub Pages serves the /docs folder, so the same file lands there under a
// plain URL a phone can open: https://<user>.github.io/musicgame/
const docs = path.resolve('docs')
fs.mkdirSync(docs, { recursive: true })
fs.writeFileSync(path.join(docs, 'index.html'), html)
fs.writeFileSync(path.join(docs, '.nojekyll'), '')
console.log(`wrote ${path.join(docs, 'index.html')} (Pages entry point)`)
