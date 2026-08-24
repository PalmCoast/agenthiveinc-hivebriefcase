import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// @vitejs/plugin-react is in devDependencies but no config file was provided;
// this wires it up so JSX + Fast Refresh work.
export default defineConfig({
  plugins: [react()],
})
