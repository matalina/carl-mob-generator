import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// Netlify sets COMMIT_REF; locally, ask git. Empty when neither is available.
function commit(): string {
  return process.env.COMMIT_REF?.slice(0, 7) || git('rev-parse --short HEAD')
}

// Major and minor come from package.json; the patch is the number of commits, so every
// push gets a new version (0.2.0 in package.json and 15 commits gives 0.2.15). Without
// git history the package.json version is used as written.
function version(): string {
  const count = git('rev-list --count HEAD')
  const [major, minor] = pkg.version.split('.')
  return count && git('rev-parse --is-shallow-repository') !== 'true' ? `${major}.${minor}.${count}` : pkg.version
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version()),
    __APP_COMMIT__: JSON.stringify(commit()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
