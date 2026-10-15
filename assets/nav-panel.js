// Hovering the banner's Projects cell drops a panel holding the project list.
// The list is inline (a mirror of projects.html, checked by tools/check-projects.mjs), not fetched: fetch fails on file:// and before a page is deployed.
(() => {
  const header = document.querySelector('.site-header')
  const cell = document.querySelector('.banner a[href$="projects.html"]')
  if (!header || !cell || cell.hasAttribute('aria-current') || !matchMedia('(hover: hover)').matches) return

  const LIST = `<ul class="strips">
  <li class="strip">
    <span class="strip-main"><span class="chip">NSF CSSI</span> <span class="strip-name">SGCC</span> <span class="strip-desc">An efficient GPU-oriented data reduction cyberinfrastructure for scientific data analysis: portable, off-the-shelf compression for every primary GPU-equipped supercomputer.</span></span>
    <span class="links quiet"><a href="https://mercury-hpg.github.io/SGCC-site/">Website</a><a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2609480">Award</a></span>
  </li>
  <li class="strip">
    <span class="strip-main"><span class="chip">Compressor</span> <span class="strip-name">pSZ/cuSZ</span> <span class="strip-desc">A reference design of GPU-accelerated error-bounded lossy compression for scientific data.</span></span>
    <span class="links quiet"><a href="https://mercury-hpg.github.io/PSZ-site/">Website</a><a href="https://github.com/szcompressor/cuSZ">Repo</a></span>
  </li>
  <li class="strip">
    <span class="strip-main"><span class="chip">Codec</span> <span class="strip-name">Parallel Huffman</span> <span class="strip-desc">Huffman coding at extreme performance on modern GPU architectures: parallel codebook construction and reduction-based encoding.</span></span>
    <span class="links quiet"><a href="https://mercury-hpg.github.io/PHF-site/">Website</a></span>
  </li>
  <li class="strip">
    <span class="strip-main"><span class="chip">Benchmark</span> <span class="strip-name">FCBench</span> <span class="strip-desc">Cross-domain benchmarking of lossless compression for floating-point data.</span></span>
    <span class="links quiet"><a href="https://github.com/Mercury-HPG/FCBench">Repo</a></span>
  </li>
</ul>`

  const panel = document.createElement('div')
  panel.className = 'nav-panel'
  panel.id = 'nav-panel-projects'
  panel.hidden = true
  panel.innerHTML = '<div class="wrap"><p class="nav-panel-title">Projects</p>' + LIST + '</div>'
  header.append(panel)
  cell.setAttribute('aria-controls', panel.id)
  cell.setAttribute('aria-expanded', 'false')

  let timer = 0
  const open = () => {
    clearTimeout(timer)
    panel.hidden = false
    cell.setAttribute('aria-expanded', 'true')
  }
  const close = () => {
    clearTimeout(timer)
    panel.hidden = true
    cell.setAttribute('aria-expanded', 'false')
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(close, 160) }

  for (const el of [cell.parentElement, panel]) {
    el.addEventListener('mouseenter', open)
    el.addEventListener('mouseleave', later)
  }
  cell.addEventListener('focus', open)
  panel.addEventListener('focusout', (e) => { if (!panel.contains(e.relatedTarget) && e.relatedTarget !== cell) later() })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
})()
