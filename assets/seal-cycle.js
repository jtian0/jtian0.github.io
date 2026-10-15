// The seal changes face (HPC/AI <-> HPC/SI) through a randomly chosen effect: TV static, crystal, chessboard, sweep, or haze.
(() => {
  const GAPS = [3, 5, 7]
  const DURATION = 1100
  const BLOCK = 5
  const hero = document.querySelector('.hero-mark')
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const marks = [...document.querySelectorAll('.hero-mark, .brand-cell img')]
  const header = document.querySelector('.site-header')
  const bannerImg = document.querySelector('.brand-cell img')
  const faces = [
    { src: 'assets/img/seal.png', alt: 'HPC/AI cube seal' },
    { src: 'assets/img/seal_SI.png', alt: 'HPC/SI cube seal' },
  ]
  for (const f of faces) { f.img = new Image(); f.img.src = f.src }

  let current = 0
  let busy = false

  const settle = (to) => {
    current = to
    for (const m of marks) m.setAttribute('src', faces[to].src)
    hero.alt = faces[to].alt
  }

  // A face redrawn at exactly the on-screen device-pixel size, halving step by step so the downscale stays sharp.
  const prescale = (img, W, H) => {
    let cur = document.createElement('canvas')
    cur.width = img.naturalWidth
    cur.height = img.naturalHeight
    cur.getContext('2d').drawImage(img, 0, 0)
    while (cur.width / 2 >= W) {
      const half = document.createElement('canvas')
      half.width = Math.ceil(cur.width / 2)
      half.height = Math.ceil(cur.height / 2)
      const hc = half.getContext('2d')
      hc.imageSmoothingQuality = 'high'
      hc.drawImage(cur, 0, 0, half.width, half.height)
      cur = half
    }
    const out = document.createElement('canvas')
    out.width = W
    out.height = H
    const oc = out.getContext('2d')
    oc.imageSmoothingQuality = 'high'
    oc.drawImage(cur, 0, 0, W, H)
    return out
  }

  // Each effect: when(c, r, cols, rows) gives a block its switch time in 0..1; snow is how long (in that scale) a block
  // shows TV static around its switch; tear is the odds a frame throws a row band sideways; blur is the Gaussian peak in px.
  const EFFECTS = {
    static: {
      blur: .4, snow: .14, tear: .7,
      when: (c, r, cols, rows) => .8 * Math.random() + .2 * ((r + .5) / rows),
    },
    crystal: {
      blur: .6, snow: .06, tear: 0,
      when: (c, r, cols, rows) => {
        const d = Math.min(1, Math.hypot((c + .5) / cols - .5, (r + .5) / rows - .5) * 1.6)
        return .55 * Math.random() + .35 * d
      },
    },
    chessboard: {
      blur: 0, snow: 0, tear: 0,
      when: (c, r) => .21 * Math.random() + ((r + c) & 1) * .5 + .1,
    },
    sweep: {
      blur: .4, snow: .12, tear: .3,
      when: (c, r, cols) => .8 * ((c + .5) / cols) + .2 * Math.random(),
    },
    haze: {
      blur: 2.2, snow: .05, tear: 0,
      when: () => .45 + .1 * Math.random(),
    },
  }
  const names = Object.keys(EFFECTS)
  let lastEffect = ''
  const pick = () => {
    const pool = names.filter((n) => n !== lastEffect)
    lastEffect = pool[Math.floor(Math.random() * pool.length)]
    return EFFECTS[lastEffect]
  }

  const dissolve = (to) => {
    const fromImg = faces[current].img
    const nextImg = faces[to].img
    if (busy || !fromImg.complete || !nextImg.complete) return
    busy = true
    const effect = pick()

    // while the hero seal is on screen it plays the effect; once it has scrolled away, the banner's small copy does
    const useBanner = !!bannerImg && !!header && !header.hasAttribute('data-name-visible') && bannerImg.getBoundingClientRect().width > 0
    const el = useBanner ? bannerImg : hero

    const dpr = window.devicePixelRatio || 1
    const rect = el.getBoundingClientRect()
    const k = rect.width / 62
    const W = Math.round(rect.width * dpr)
    const H = Math.round(rect.height * dpr)
    const from = prescale(fromImg, W, H)
    const next = prescale(nextImg, W, H)

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.width = W
    canvas.height = H
    if (useBanner) {
      Object.assign(canvas.style, {
        position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', zIndex: 30,
        width: W / dpr + 'px', height: H / dpr + 'px', pointerEvents: 'none',
      })
      document.body.append(canvas)
    } else {
      canvas.className = hero.className
      Object.assign(canvas.style, {
        position: 'absolute', left: hero.offsetLeft + 'px', top: hero.offsetTop + 'px',
        width: W / dpr + 'px', height: H / dpr + 'px', pointerEvents: 'none',
      })
      hero.parentElement.append(canvas)
    }
    el.style.visibility = 'hidden'

    // whole device pixels per block, so no block ever straddles a pixel and gets resampled
    const step = Math.max(useBanner ? 1 : 2, Math.round(BLOCK * dpr * k))
    const cols = Math.ceil(W / step)
    const rows = Math.ceil(H / step)
    const ctx = canvas.getContext('2d')
    const when = new Float32Array(cols * rows)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) when[r * cols + c] = effect.when(c, r, cols, rows)
    }

    // fresh per-pixel grey noise each frame: the TV snow
    const noise = document.createElement('canvas')
    noise.width = W
    noise.height = H
    const nctx = noise.getContext('2d')
    const grain = nctx.createImageData(W, H)
    const reseed = () => {
      const d = grain.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() < .5 ? 0 : 150 + Math.random() * 105
        d[i] = d[i + 1] = d[i + 2] = v
        d[i + 3] = 255
      }
      nctx.putImageData(grain, 0, 0)
    }

    const draw = (p) => {
      ctx.clearRect(0, 0, W, H)
      const shift = new Int16Array(rows)
      if (Math.random() < effect.tear) {
        const r0 = Math.floor(Math.random() * rows)
        const dx = Math.round((Math.random() < .5 ? -1 : 1) * (2 + Math.random() * 5) * dpr * k)
        for (let r = r0; r < Math.min(rows, r0 + 1 + Math.floor(Math.random() * 2)); r++) shift[r] = dx
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = when[r * cols + c]
          const x = c * step
          const y = r * step
          const w = Math.min(step, W - x)
          const h = Math.min(step, H - y)
          ctx.drawImage(p > t ? next : from, x, y, w, h, x + shift[r], y, w, h)
        }
      }
      if (effect.snow) {
        reseed()
        ctx.globalCompositeOperation = 'source-atop'
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (Math.abs(p - when[r * cols + c]) >= effect.snow) continue
            const x = c * step
            const y = r * step
            const w = Math.min(step, W - x)
            const h = Math.min(step, H - y)
            ctx.drawImage(noise, x, y, w, h, x + shift[r], y, w, h)
          }
        }
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    // a Gaussian blur that swells mid-transition and is gone at both ends, so the hand-off to the <img> stays soft
    const base = getComputedStyle(el).filter
    const keep = base === 'none' ? '' : base + ' '

    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / DURATION) * 1.1
      if (p >= 1.05) {
        settle(to)
        el.style.visibility = ''
        canvas.remove()
        busy = false
        return
      }
      canvas.style.filter = keep + 'blur(' + (effect.blur * k * Math.sin(Math.PI * p / 1.05)).toFixed(2) + 'px)'
      draw(p)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  let timer = 0
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => { dissolve(1 - current); schedule() }, GAPS[Math.floor(Math.random() * GAPS.length)] * 1000)
  }
  schedule()

  // an unadvertised click: no cursor, tooltip or focus ring says it is there
  hero.addEventListener('click', () => {
    if (busy) return
    dissolve(1 - current)
    schedule()
  })
})()
