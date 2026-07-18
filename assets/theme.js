// NEOSELF — theme.js
//
// One file, one request. These were six separate assets, which cost six round
// trips and 683 extra bytes for 4KB of code — connection setup dominates on the
// hardware this store is built for, and six files share no compression context.
//
// Kept as clearly-fenced sections rather than merged into soup. If any one of
// these grows past ~100 lines it should come back out into its own file and be
// concatenated at build time; below that, a build step costs more than it saves.
//
// Everything here is defensive about its own absence: every block checks for its
// elements and bails. The same file loads on every template, and most templates
// have most of these elements missing.

// ====================================================================
// NAV
// ====================================================================

// Mobile menu only.
//
// No scroll listeners, no IntersectionObservers, no animation frame loops —
// there is no scroll-reveal on this site and the performance budget has no room
// for machinery nothing needs. This file exists to toggle one attribute.

const toggle = document.querySelector('[data-nav-toggle]')
const panel = document.querySelector('[data-mobile-nav]')

if (toggle && panel) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    panel.hidden = !open
    document.documentElement.classList.toggle('nav-open', open)
    // Keep the bar in view while the menu is open — otherwise the scroll-hide
    // slides the open menu off with it.
    if (open) document.querySelector('[data-header]')?.classList.remove('is-hidden')
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true')
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false)
      toggle.focus()
    }
  })
}

// ====================================================================
// HEADER
// ====================================================================

// The sticky header. On the homepage the hero carries its own brand + vertical
// nav, so the bar hides over the hero, then behaves like Rhode's — hidden on
// scroll-down, bounces back on scroll-up. Pages with no hero take a paper backing
// once the top scrolls away.

const header = document.querySelector('[data-header]')

if (header) {
  const hero = document.querySelector('.hero')

  if (hero) {
    // The neoself bar. Shows at the top, hides on scroll-down, and bounces back
    // on scroll-up (and at the very top) — Rhode-style. White over the hero, then
    // ink on paper once past it. One passive, rAF-throttled scroll handler.
    let lastY = window.scrollY
    let ticking = false
    const update = () => {
      const y = window.scrollY
      header.classList.toggle('is-scrolled', y > hero.offsetHeight - 80)
      // While the menu is open, never hide the bar (it would take the menu with it).
      if (document.documentElement.classList.contains('nav-open')) {
        header.classList.remove('is-hidden')
      } else if (y < 8 || y < lastY - 4) {
        header.classList.remove('is-hidden')
      } else if (y > lastY + 4) {
        header.classList.add('is-hidden')
      }
      lastY = y
      ticking = false
    }
    update()
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true
          requestAnimationFrame(update)
        }
      },
      { passive: true }
    )
  } else if ('IntersectionObserver' in window) {
    // Inner pages: solidify once the top scrolls away.
    const sentinel = document.createElement('div')
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.style.cssText =
      'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none'
    document.body.prepend(sentinel)
    new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
      { threshold: 0 }
    ).observe(sentinel)
  }
}

// ====================================================================
// REVIEWS
// ====================================================================

// Reviewer-attribute filtering.
//
// Filters already-rendered markup, so it degrades to "all reviews visible" with
// JS off and costs no request. Baymard's beauty study found reviewer attributes
// matter more than star ratings here — this is the one differentiator in the
// competitive set, so it should not depend on a third-party widget.
//
// There is deliberately no sentiment filter. Showing only positives is a
// misrepresentation risk in the US and an always-unfair practice in the UK.

const root = document.querySelector('[data-reviews]')

if (root) {
  const list = root.querySelector('[data-review-list]')
  const empty = root.querySelector('[data-review-empty]')
  const counter = root.querySelector('[data-review-count]')
  const reviews = [...list.querySelectorAll('.review')]
  const active = { skin: '', age: '', concern: '' }

  const apply = () => {
    let shown = 0
    for (const el of reviews) {
      const ok =
        (!active.skin || el.dataset.skin === active.skin) &&
        (!active.age || el.dataset.age === active.age) &&
        (!active.concern || el.dataset.concern === active.concern)
      el.hidden = !ok
      if (ok) shown++
    }

    empty.hidden = shown !== 0

    const filtering = active.skin || active.age
    counter.hidden = !filtering
    if (filtering) {
      counter.textContent = `Showing ${shown} of ${reviews.length}`
    }
  }

  root.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip')
    if (!chip) return

    const { filter, value } = chip.dataset
    active[filter] = value

    for (const sibling of root.querySelectorAll(`.chip[data-filter="${filter}"]`)) {
      sibling.classList.toggle('is-active', sibling === chip)
    }

    apply()
  })
}

// ====================================================================
// PRODUCT
// ====================================================================

// PDP behaviour: gallery switching + the mobile buy drawer.

// --- gallery -----------------------------------------------------------
const gallery = document.querySelector('[data-gallery]')

if (gallery) {
  gallery.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-gallery-thumb]')
    if (!thumb) return

    const index = thumb.dataset.galleryThumb

    for (const t of gallery.querySelectorAll('[data-gallery-thumb]')) {
      const on = t === thumb
      t.classList.toggle('is-active', on)
      t.setAttribute('aria-selected', String(on))
    }

    for (const frame of gallery.querySelectorAll('[data-gallery-frame]')) {
      frame.classList.toggle('is-active', frame.dataset.galleryFrame === index)
    }
  })
}

// --- mobile buy drawer -------------------------------------------------
//
// A drawer, not a permanent bar. The one honest test of this found the naive
// sticky bar produced no significant conversion difference on mobile despite
// lifting add-to-cart clicks — only the drawer won. So it appears when the real
// button leaves the viewport and gets out of the way otherwise, rather than
// permanently eating screen on the device that matters most here.
//
// IntersectionObserver, not a scroll listener: no work on the main thread
// between intersections, which matters on the three-year-old Redmi this is
// built for.

const buybar = document.querySelector('[data-buybar]')
const atc = document.querySelector('.pdp__atc')

if (buybar && atc && 'IntersectionObserver' in window) {
  buybar.hidden = false

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        buybar.removeAttribute('data-visible')
      } else {
        buybar.setAttribute('data-visible', '')
      }
    },
    { threshold: 0 }
  )

  io.observe(atc)
}

// ====================================================================
// CAROUSEL + CARD ADD-TO-CART
// ====================================================================

// Prev/next scroll the snap track by one card. Click handlers only — no scroll
// listener, per this file's rule.
for (const track of document.querySelectorAll('[data-carousel]')) {
  const box = track.closest('.container') || document
  const step = () => {
    const it = track.querySelector('.the-system__item')
    return it ? it.getBoundingClientRect().width + 20 : Math.round(track.clientWidth * 0.8)
  }
  box
    .querySelector('[data-carousel-prev]')
    ?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }))
  box
    .querySelector('[data-carousel-next]')
    ?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }))

  // Drag / swipe to scroll, grab cursor (see base.css). Pointer events cover
  // mouse and touch. A drag past a few px cancels the click so a card link is
  // not followed when the user meant to swipe.
  let down = false
  let startX = 0
  let startScroll = 0
  let moved = false
  track.addEventListener('pointerdown', (e) => {
    down = true
    moved = false
    startX = e.clientX
    startScroll = track.scrollLeft
    track.classList.add('is-dragging')
  })
  track.addEventListener('pointermove', (e) => {
    if (!down) return
    const dx = e.clientX - startX
    if (Math.abs(dx) > 4) moved = true
    track.scrollLeft = startScroll - dx
  })
  // Kill the browser's native link/image drag so the whole card doesn't get
  // "picked up" — that was the un-smooth feel.
  track.addEventListener('dragstart', (e) => e.preventDefault())
  const release = () => {
    down = false
    track.classList.remove('is-dragging')
  }
  track.addEventListener('pointerup', release)
  track.addEventListener('pointerleave', release)
  track.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    true
  )

  // Rhode-style: a big "drag" cursor follows the mouse over the carousel (mouse
  // only — touch already swipes). The default cursor is hidden via .has-cursor.
  let cursor = document.querySelector('.drag-cursor')
  if (!cursor) {
    cursor = document.createElement('div')
    cursor.className = 'drag-cursor'
    cursor.setAttribute('aria-hidden', 'true')
    cursor.textContent = 'drag'
    document.body.appendChild(cursor)
  }
  track.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return
    track.classList.add('has-cursor')
    cursor.classList.add('is-on')
  })
  track.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%) scale(${down ? 0.82 : 1})`
  })
  track.addEventListener('pointerleave', () => {
    track.classList.remove('has-cursor')
    cursor.classList.remove('is-on')
  })
}

// Add-to-cart: the corner pill fills the whole card with a confirmation, then
// resets. The card is a link; the button sits outside it, so this intercepts
// only itself.
for (const btn of document.querySelectorAll('[data-atc]')) {
  const card = btn.closest('.card') || btn
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    if (card.classList.contains('is-added')) return
    card.classList.add('is-added')
    const id = btn.dataset.variant
    if (id) {
      fetch('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'id=' + encodeURIComponent(id) + '&quantity=1',
      }).catch(() => {})
    }
    setTimeout(() => card.classList.remove('is-added'), 1800)
  })
}

// The footer wordmark grows as it enters view. Observer, not a scroll handler.
const footerMark = document.querySelector('.footer__wordmark')
if (footerMark && 'IntersectionObserver' in window) {
  new IntersectionObserver(
    ([entry]) => footerMark.classList.toggle('is-in', entry.isIntersecting),
    { threshold: 0.25 }
  ).observe(footerMark)
}

// ====================================================================
// TRANSITIONS
// ====================================================================

// Cross-document view transitions: the product image travels.
//
// Shopify is a multi-page app — every click is a real navigation. Cross-document
// view transitions were built for exactly that: the browser snapshots the
// outgoing page, renders the incoming one, and morphs any element the two share
// a `view-transition-name` with. Clicking CLEAN on the homepage makes that card's
// bottle fly into the PDP gallery, and the page arrives around it.
//
// No app, no framework, no SPA router. `@view-transition { navigation: auto }`
// in CSS does the navigation; this file only decides WHICH card is the one
// travelling, because a view-transition-name must be unique in the document and
// there are four cards on screen.
//
// Chrome 126+ and Safari 18.2+. India is ~93% Android, so coverage in the market
// this store serves is close to total. Everywhere else it is a normal page load —
// nothing breaks, the effect is simply absent.
//
// Honest note: there is no evidence this sells more serum. It is craft. It earns
// its ~1KB because it makes navigation feel continuous rather than destructive,
// and because it costs nothing on the devices that cannot run it.

const NAME = 'product-media'

const handleFrom = (url) => {
  const m = new URL(url, location.origin).pathname.match(/^\/products\/([^/?#]+)/)
  return m ? m[1] : null
}

/** The card image for a product handle, on a listing page. */
const cardImageFor = (handle) =>
  document.querySelector(`a[href="/products/${handle}"] img`)

/** The visible gallery image, on a PDP. */
const galleryImage = () => document.querySelector('.gallery__frame.is-active img')

const name = (el) => {
  if (el) el.style.viewTransitionName = NAME
}
const unname = (el) => {
  if (el) el.style.viewTransitionName = ''
}

// --- leaving a page ----------------------------------------------------
// pageswap fires after navigation is committed but before this document is
// snapshotted — the last moment we can mark the element that should travel.
window.addEventListener('pageswap', (e) => {
  if (!e.viewTransition) return

  const to = e.activation?.entry?.url
  if (!to) return

  const handle = handleFrom(to)
  // Listing -> PDP: the clicked card travels.
  // PDP -> listing: the gallery image travels back to its card.
  const el = handle ? cardImageFor(handle) : galleryImage()
  name(el)

  // The name must not survive the transition, or a later navigation finds two
  // elements claiming it and the browser silently skips the morph.
  e.viewTransition.finished.finally(() => unname(el))
})

// --- arriving at a page ------------------------------------------------
// The incoming half. Whichever element here matches the one that left gets the
// same name, and the browser morphs between them.
window.addEventListener('pagereveal', (e) => {
  if (!e.viewTransition) return

  const handle = handleFrom(location.href)
  const el = handle
    ? galleryImage() // arriving at a PDP
    : cardImageFor(handleFrom(document.referrer || '')) // arriving back at a listing
  name(el)

  e.viewTransition.ready.finally(() => unname(el))
})

// --- on going back -----------------------------------------------------
// Measured, not assumed: a back gesture reports navigationType "traverse" and
// the listing is restored from BFCache, so Chrome gives no viewTransition and
// the guards above bail out.
//
// That is the right outcome, not a gap. A BFCache restore is instantaneous —
// wrapping it in a 420ms morph would make Back measurably slower to serve an
// animation nobody asked for. Forward morphs because the page is being built;
// Back snaps because the page already exists.

// ====================================================================
// DOSSIER
// ====================================================================

// The dossier frame's readout.
//
// Keeps the bottom corners honest: bottom-left names the section you are
// actually looking at, bottom-right counts your position through the document.
// It is the difference between a decorative border and an instrument.
//
// IntersectionObserver, not a scroll handler — no work on the main thread
// between section changes, which matters on the three-year-old Redmi this is
// built for. Bails entirely below 1024px, where the frame does not render.

const frame = document.querySelector('.frame')
const label = document.querySelector('[data-frame-label]')
const count = document.querySelector('[data-frame-count]')

if (frame && label && count && window.matchMedia('(min-width: 1024px)').matches) {
  // Sections declare their own identity rather than the frame guessing from
  // markup — a section that moves in the theme editor must not break the
  // readout.
  const sections = [...document.querySelectorAll('[data-doc-section]')]

  // A page with nothing to report should not report a dash. The frame is a
  // readout; with no sections it is just two stray characters in the corners.
  if (!sections.length) {
    frame.hidden = true
  } else {
    const total = String(sections.length).padStart(2, '0')

    const set = (el) => {
      const name = el.dataset.docSection
      const index = String(sections.indexOf(el) + 1).padStart(2, '0')
      label.textContent = name
      count.textContent = `${index} / ${total}`
    }

    set(sections[0])

    // Fires when a section crosses the middle of the viewport, so the readout
    // changes when the section is genuinely the thing you are reading — not the
    // moment its top edge appears.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) set(entry.target)
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    )

    for (const s of sections) io.observe(s)
  }
}

