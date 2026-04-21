import React from 'react'
import ReactDOM from 'react-dom/client'
import { SourceMapConsumer } from 'source-map'
import App from '@/App.jsx'
import '@/index.css'

// Initialize SourceMapConsumer for source map parsing
SourceMapConsumer.initialize({
  'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.4/lib/mappings.wasm'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
  })
}
