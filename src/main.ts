import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL(/* @vite-ignore */ '../sw.js', import.meta.url), { updateViaCache: 'none' })
      .then(() => navigator.storage?.persist?.())
      .catch(error => console.error('Service worker registration failed:', error))
  })
}

const app = mount(App, {
  target: document.body!,
})

export default app
