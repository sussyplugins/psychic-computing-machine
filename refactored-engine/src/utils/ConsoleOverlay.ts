// Simple in-game overlay - just listen to errors, don't touch console
(function() {
  // Create overlay container
  const overlay = document.createElement('div')
  overlay.id = 'log-overlay'
  overlay.style.cssText = `
    position: fixed;
    right: 10px;
    top: 10px;
    width: 360px;
    max-height: 80vh;
    background: rgba(10, 10, 10, 0.92);
    color: #dcdcdc;
    font-family: monospace;
    font-size: 12px;
    border: 1px solid #444;
    z-index: 2000;
    display: none;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    flex-direction: column;
  `

  // Create header
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #444;
    flex-shrink: 0;
  `

  const title = document.createElement('strong')
  title.textContent = 'Errors'
  title.style.color = '#ff6b6b'
  let autoShow = true

  function updateTitle() {
    title.textContent = autoShow ? 'Errors' : 'Errors (muted)'
  }

  const clearBtn = document.createElement('button')
  clearBtn.textContent = 'Clear'
  clearBtn.style.cssText = `
    background: #222;
    color: #fff;
    border: 1px solid #333;
    padding: 2px 6px;
    cursor: pointer;
  `

  header.appendChild(title)
  header.appendChild(clearBtn)

  // Create messages container
  const messages = document.createElement('div')
  messages.id = 'log-messages'
  messages.style.cssText = `
    overflow-y: auto;
    padding: 10px;
    flex: 1;
  `

  overlay.appendChild(header)
  overlay.appendChild(messages)
  document.body.appendChild(overlay)

  // Clear button handler
  clearBtn.addEventListener('click', () => {
    messages.innerHTML = ''
  })

  // Keyboard shortcuts (capture phase so inputs don't swallow them)
  window.addEventListener('keydown', (e) => {
    try {
      const key = (e.key || '').toLowerCase()
      if ((e.ctrlKey || e.metaKey) && key === 'h') {
        e.preventDefault()
        e.stopPropagation()
        overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none'
        return
      }

      // Ctrl+V: hide console overlay immediately and mute auto-show
      if ((e.ctrlKey || e.metaKey) && key === 'v') {
        e.preventDefault()
        e.stopPropagation()
        autoShow = false
        updateTitle()
        overlay.style.display = 'none'
        return
      }

      // Ctrl+Shift+V: unmute and show overlay again
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'v') {
        e.preventDefault()
        e.stopPropagation()
        autoShow = true
        updateTitle()
        overlay.style.display = 'flex'
        return
      }
    } catch (err) {
      // ignore
    }
  }, true)

  // Also listen for keyup (some environments only emit keyup reliably)
  window.addEventListener('keyup', (e) => {
    try {
      const key = (e.key || '').toLowerCase()
      if ((e.ctrlKey || e.metaKey) && key === 'v') {
        e.preventDefault()
        e.stopPropagation()
        overlay.style.display = 'none'
      }
    } catch (err) {}
  }, true)

  // Also hide overlay on paste events (covers systems that handle paste before key events)
  window.addEventListener('paste', (e) => {
    try {
      overlay.style.display = 'none'
    } catch (err) {}
  }, true)

  // FPS counter (toggle with Ctrl+C)
  const fpsEl = document.createElement('div')
  fpsEl.id = 'fps-counter'
  fpsEl.style.cssText = `
    position: fixed;
    left: 10px;
    top: 10px;
    padding: 6px 8px;
    background: rgba(0,0,0,0.6);
    color: #bada55;
    font-family: monospace;
    font-size: 12px;
    z-index: 2001;
    border: 1px solid #333;
    display: none;
  `
  fpsEl.textContent = 'FPS: --'
  document.body.appendChild(fpsEl)

  let lastTime = performance.now()
  let frameCount = 0
  let fps = 0
  let fpsVisible = false

  function fpsTick(now: number) {
    frameCount++
    const dt = now - lastTime
    if (dt >= 500) {
      fps = Math.round((frameCount * 1000) / dt)
      frameCount = 0
      lastTime = now
      if (fpsVisible) fpsEl.textContent = `FPS: ${fps}`
    }
    requestAnimationFrame(fpsTick)
  }
  requestAnimationFrame(fpsTick)

  // Also listen for Ctrl+C in capture phase to toggle FPS
  window.addEventListener('keydown', (e) => {
    try {
      if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'c') {
        e.preventDefault()
        e.stopPropagation()
        fpsVisible = !fpsVisible
        fpsEl.style.display = fpsVisible ? 'block' : 'none'
      }
    } catch (err) {}
  }, true)

  // Listen to errors
  window.addEventListener('error', (ev) => {
    const errorMsg = ev.message + ' (' + ev.filename + ':' + ev.lineno + ':' + ev.colno + ')'
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    const html = '<div style="margin-bottom:8px;padding:8px;background:rgba(255,0,0,0.1);border-left:2px solid #ff6b6b">[' + time + '] ' + errorMsg + '</div>'
    messages.innerHTML += html
    messages.scrollTop = messages.scrollHeight
    if (autoShow) overlay.style.display = 'flex'
  })

  // Listen to unhandled rejections
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason instanceof Error ? ev.reason.message : String(ev.reason)
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    const html = '<div style="margin-bottom:8px;padding:8px;background:rgba(255,0,0,0.1);border-left:2px solid #ff6b6b">[' + time + '] Unhandled: ' + reason + '</div>'
    messages.innerHTML += html
    messages.scrollTop = messages.scrollHeight
    if (autoShow) overlay.style.display = 'flex'
  })
})()

export {}
