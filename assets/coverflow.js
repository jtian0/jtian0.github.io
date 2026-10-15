// Presentations as a Cover Flow (default): slide covers in 3D, the centred talk's text as its caption, a thumbnail strip below.
// A Cover Flow / Grid switch returns to the plain card grid, which stays in the page untouched.
(() => {
  const list = document.querySelector('.talks')
  if (!list || list.children.length < 2) return

  const items = [...list.children]
  const bar = document.createElement('div')
  bar.className = 'cf-bar'
  const modes = document.createElement('div')
  modes.className = 'quiet'
  modes.setAttribute('role', 'group')
  modes.setAttribute('aria-label', 'View')
  const bFlow = document.createElement('button')
  bFlow.type = 'button'
  bFlow.textContent = 'Cover Flow'
  const bGrid = document.createElement('button')
  bGrid.type = 'button'
  bGrid.textContent = 'Grid'
  modes.append(bFlow, bGrid)
  bar.append(modes)

  const root = document.createElement('div')
  root.className = 'cf'
  const stage = document.createElement('div')
  stage.className = 'cf-stage'
  stage.tabIndex = 0
  stage.setAttribute('role', 'group')
  stage.setAttribute('aria-roledescription', 'carousel')
  stage.setAttribute('aria-label', 'Talks')
  const track = document.createElement('div')
  track.className = 'cf-track'
  const caption = document.createElement('div')
  caption.className = 'cf-caption'
  caption.setAttribute('aria-live', 'polite')
  const strip = document.createElement('div')
  strip.className = 'cf-thumbs'
  strip.setAttribute('role', 'tablist')

  const covers = []
  const bodies = []
  const thumbs = []
  let start = 0
  items.forEach((li, i) => {
    const cover = li.querySelector('.talk-thumb').cloneNode(true)
    const body = li.querySelector('.talk-body').cloneNode(true)
    const img = cover.querySelector('img')
    img.loading = 'eager'
    img.draggable = false
    const chip = body.querySelector('.chip')
    if (chip && /PACT/.test(chip.textContent)) start = i
    // one flex item for the work's name (it can contain <i>), then the pills on the same row
    const h3 = body.querySelector('h3')
    const nm = document.createElement('span')
    nm.className = 'cf-name'
    for (const n of [...h3.childNodes]) if (n !== chip) nm.append(n)
    h3.append(nm)
    const links = body.querySelector('.links')
    if (links) h3.append(links)

    const thumb = document.createElement('button')
    thumb.type = 'button'
    thumb.className = 'cf-thumb'
    thumb.dataset.i = i
    thumb.setAttribute('role', 'tab')
    thumb.setAttribute('aria-label', body.querySelector('h3').textContent.replace(/\s*Paper\s*Slides\s*$/, '').trim())
    const timg = document.createElement('img')
    timg.src = img.currentSrc || img.src
    timg.alt = ''
    timg.draggable = false
    thumb.append(timg)
    const work = body.querySelector('h3').cloneNode(true)
    if (work.querySelector('.chip')) work.querySelector('.chip').remove()
    if (work.querySelector('.links')) work.querySelector('.links').remove()
    const tag = document.createElement('span')
    tag.className = 'cf-tag'
    if (chip) {
      const conf = document.createElement('b')
      conf.textContent = chip.textContent
      tag.append(conf)
    }
    const name = document.createElement('span')
    name.textContent = work.textContent.trim()
    tag.append(name)
    thumb.append(tag)

    cover.classList.add('cf-cover')
    cover.dataset.i = i
    track.append(cover)
    body.classList.add('cf-body')
    caption.append(body)
    strip.append(thumb)
    covers.push(cover)
    bodies.push(body)
    thumbs.push(thumb)
  })
  stage.append(track)
  const navrow = document.createElement('div')
  navrow.className = 'cf-nav'
  const prev = document.createElement('button')
  prev.type = 'button'
  prev.className = 'cf-arrow'
  prev.setAttribute('aria-label', 'Previous talk')
  prev.innerHTML = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M8 1.5L3.5 6L8 10.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  const next = document.createElement('button')
  next.type = 'button'
  next.className = 'cf-arrow'
  next.setAttribute('aria-label', 'Next talk')
  next.innerHTML = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4 1.5L8.5 6L4 10.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  navrow.append(prev, strip, next)
  root.append(stage, caption, navrow)
  list.before(bar, root)

  let cur = start
  const show = () => {
    covers.forEach((c, i) => {
      const d = i - cur
      const ad = Math.abs(d)
      c.style.setProperty('--d', d)
      c.style.setProperty('--ad', ad)
      c.style.setProperty('--s', Math.sign(d))
      c.style.zIndex = 100 - ad
      c.classList.toggle('is-active', d === 0)
      c.setAttribute('aria-hidden', ad > 3 ? 'true' : 'false')
      bodies[i].classList.toggle('is-active', d === 0)
      thumbs[i].classList.toggle('is-active', d === 0)
      thumbs[i].setAttribute('aria-selected', d === 0 ? 'true' : 'false')
    })
    prev.disabled = cur === 0
    next.disabled = cur === covers.length - 1
    const t = thumbs[cur]
    strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' })
  }
  const go = (i) => {
    const next = Math.max(0, Math.min(covers.length - 1, i))
    if (next === cur) return
    cur = next
    show()
  }

  // cover width follows the column, so the stage keeps its proportions at any width
  const size = () => {
    if (!stage.clientWidth) return
    root.style.setProperty('--cw', Math.min(stage.clientWidth * .62, 560) + 'px')
  }
  new ResizeObserver(size).observe(stage)
  size()
  show()

  const setMode = (flow) => {
    root.hidden = !flow
    list.hidden = flow
    bFlow.setAttribute('aria-pressed', String(flow))
    bGrid.setAttribute('aria-pressed', String(!flow))
    if (flow) { size(); show() }
  }
  bFlow.addEventListener('click', () => setMode(true))
  bGrid.addEventListener('click', () => setMode(false))
  setMode(true)

  let drag = null
  let moved = false
  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, i: cur }; moved = false })
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    if (Math.abs(dx) > 8) moved = true
    go(drag.i - Math.round(dx / 90))
  })
  const end = () => { drag = null }
  stage.addEventListener('pointerup', end)
  stage.addEventListener('pointercancel', end)
  stage.addEventListener('click', (e) => {
    if (moved) return
    const c = e.target.closest('.cf-cover')
    if (c) go(Number(c.dataset.i))
  })
  prev.addEventListener('click', () => go(cur - 1))
  next.addEventListener('click', () => go(cur + 1))
  strip.addEventListener('click', (e) => {
    const t = e.target.closest('.cf-thumb')
    if (t) go(Number(t.dataset.i))
  })

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(cur - 1)
    else if (e.key === 'ArrowRight') go(cur + 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(covers.length - 1)
    else return
    e.preventDefault()
  })

  // sideways wheel / trackpad swipe; vertical scrolling is left to the page
  let wheelAt = 0
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    e.preventDefault()
    const now = performance.now()
    if (now - wheelAt < 220 || Math.abs(e.deltaX) < 8) return
    wheelAt = now
    go(cur + Math.sign(e.deltaX))
  }, { passive: false })
})()
