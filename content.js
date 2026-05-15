/**
 * Bright Standard Chrome Extension — Content Script
 * Runs on teacherspayteachers.com/Product/* pages
 * Scrapes lesson content, calls the scoring API, renders the Five Checks panel
 */

const SCORE_API = 'https://gexxdsiowglhrxkkvsrv.supabase.co/functions/v1/score-content'
const BS_SITE = 'https://thebrightstandard.com'

// ─── CHECK COLORS (matches Bright Standard design system) ───────────────────
const CHECK_COLORS = {
  rigor:       '#3B82F6',  // blue
  inclusivity: '#22C55E',  // green
  perspective: '#A855F7',  // purple
  empathy:     '#F97316',  // orange/coral
  thinking:    '#EC4899',  // pink
}

const CHECK_LABELS = {
  rigor:       'Rigor',
  inclusivity: 'Inclusivity',
  perspective: 'Perspectives',
  empathy:     'Empathy',
  thinking:    'Critical Thinking',
}

// ─── SCRAPE TPT PAGE ────────────────────────────────────────────────────────
function scrapePage() {
  const get = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
  const getAll = (selector) => [...document.querySelectorAll(selector)].map(el => el.textContent?.trim()).filter(Boolean)

  const title = get('h1') ||
    get('[data-testid="product-title"]') ||
    get('.ProductHeader-module__title___') ||
    document.title.split('|')[0].trim()

  const description = get('[data-testid="product-description"]') ||
    get('.ProductDescription') ||
    get('.description') ||
    get('[class*="description"]') || ''

  // Grade levels — TPT shows these as text near "Grade" label
  const gradeEls = getAll('[class*="grade"], [class*="Grade"]')
  const grade = gradeEls.join(', ') ||
    get('[data-testid="grade-levels"]') ||
    get('[class*="GradeLevels"]') || ''

  // Subject
  const subject = get('[data-testid="subject"]') ||
    get('[class*="subject"]') || ''

  // Price
  const priceText = get('[data-testid="price"]') ||
    get('[class*="price"]') ||
    get('[class*="Price"]') || ''

  // Creator name
  const creator = get('[data-testid="author-name"]') ||
    get('[class*="AuthorInfo"] a') ||
    get('[class*="seller"]') || ''

  // Learning objectives and preview bullets
  const bullets = getAll('li').slice(0, 20)
  const objectiveLike = bullets.filter(b =>
    b.match(/student|learn|understand|analyze|create|apply|identify|explain|demonstrate/i)
  )

  // Standards
  const standards = getAll('[class*="standard"]').join('; ')

  // Aggregate a content preview — take all visible text up to 2000 chars
  const allText = document.body.innerText
    .replace(/\s+/g, ' ')
    .slice(0, 3000)

  const tptUrl = window.location.href

  return {
    tpt_url: tptUrl,
    title,
    description: description.slice(0, 2000),
    grade,
    subject,
    creator_name: creator,
    price: priceText.replace(/[^0-9.]/g, ''),
    learning_objectives: objectiveLike.slice(0, 5),
    content_preview: [
      standards ? `Standards: ${standards}` : '',
      objectiveLike.length ? `Objectives: ${objectiveLike.join('; ')}` : '',
      allText.slice(0, 2000),
    ].filter(Boolean).join('\n\n').slice(0, 3000),
    scan_source: 'extension',
    store_result: true,
  }
}

// ─── CREATE THE PANEL DOM ───────────────────────────────────────────────────
function createPanel() {
  const panel = document.createElement('div')
  panel.id = 'bs-panel'
  panel.innerHTML = `
    <div class="bs-header">
      <div class="bs-logo">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" stroke="#F2C94C" stroke-width="1.5"/>
          <path d="M5 9l3 3 5-5" stroke="#F2C94C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="bs-logo-text">Bright Standard</span>
      </div>
      <button class="bs-close" aria-label="Close">✕</button>
    </div>
    <div class="bs-body">
      <div class="bs-loading" id="bs-loading">
        <div class="bs-spinner"></div>
        <span>Scoring against Five Checks…</span>
      </div>
      <div class="bs-result" id="bs-result" style="display:none">
        <div class="bs-badge" id="bs-badge"></div>
        <div class="bs-headline" id="bs-headline"></div>
        <div class="bs-scores" id="bs-scores"></div>
        <div class="bs-gap" id="bs-gap" style="display:none"></div>
        <div class="bs-works" id="bs-works" style="display:none"></div>
        <div class="bs-cta-wrap">
          <a class="bs-cta" id="bs-cta" href="${BS_SITE}" target="_blank">
            See certified lessons →
          </a>
          <button class="bs-improve" id="bs-improve" style="display:none">
            How to fix this
          </button>
        </div>
      </div>
      <div class="bs-error" id="bs-error" style="display:none">
        <span>Couldn't score this lesson. <a href="${BS_SITE}" target="_blank">Try on Bright Standard →</a></span>
      </div>
    </div>
    <div class="bs-footer">
      <span>Five Checks: Rigor · Inclusivity · Perspectives · Empathy · Thinking</span>
    </div>
  `
  return panel
}

// ─── RENDER SCORES ──────────────────────────────────────────────────────────
function renderScores(data) {
  const loading = document.getElementById('bs-loading')
  const result  = document.getElementById('bs-result')
  const badge   = document.getElementById('bs-badge')
  const headline = document.getElementById('bs-headline')
  const scoresEl = document.getElementById('bs-scores')
  const gapEl    = document.getElementById('bs-gap')
  const worksEl  = document.getElementById('bs-works')
  const cta      = document.getElementById('bs-cta')
  const improve  = document.getElementById('bs-improve')

  loading.style.display = 'none'
  result.style.display  = 'block'

  // Badge
  if (data.certified) {
    badge.innerHTML = `<span class="bs-certified">✓ Bright Standard Certified</span>`
  } else {
    const overall = typeof data.overall === 'number' ? data.overall.toFixed(1) : '—'
    badge.innerHTML = `<span class="bs-score-num">${overall}</span><span class="bs-score-denom">/5</span><span class="bs-not-certified">Not yet certified</span>`
  }

  // Headline
  if (data.headline) {
    headline.textContent = data.headline
    headline.style.display = 'block'
  }

  // Five Checks circles
  const scores = data.scores || {}
  scoresEl.innerHTML = Object.entries(CHECK_LABELS).map(([key, label]) => {
    const score = scores[key] ?? 0
    const color = CHECK_COLORS[key]
    const passing = score >= 4
    const pct = (score / 5) * 100
    return `
      <div class="bs-check">
        <div class="bs-check-ring" style="--pct:${pct}%;--color:${color}">
          <svg viewBox="0 0 36 36" class="bs-ring-svg">
            <circle class="bs-ring-bg" cx="18" cy="18" r="15.9" fill="none" stroke-width="2.5"/>
            <circle class="bs-ring-fill" cx="18" cy="18" r="15.9" fill="none" stroke="${color}"
              stroke-width="2.5" stroke-dasharray="${pct} ${100 - pct}"
              stroke-dashoffset="25" stroke-linecap="round"/>
          </svg>
          <span class="bs-check-num" style="color:${passing ? color : '#9A8B7E'}">${score}</span>
        </div>
        <div class="bs-check-label">${label}</div>
        ${!passing && data.suggestions?.[key]?.[0] ? `<div class="bs-check-tip">↑ ${data.suggestions[key][0]?.slice(0, 60)}…</div>` : ''}
      </div>
    `
  }).join('')

  // Biggest gap
  if (data.biggest_gap && !data.certified) {
    gapEl.style.display = 'block'
    gapEl.innerHTML = `<strong>Biggest gap:</strong> ${data.biggest_gap}`
  }

  // What works
  if (data.what_works) {
    worksEl.style.display = 'block'
    worksEl.innerHTML = `<strong>What works:</strong> ${data.what_works}`
  }

  // CTAs
  if (data.certified) {
    cta.textContent = 'View on Bright Standard →'
    cta.href = data.bright_standard_lesson_id
      ? `${BS_SITE}/lesson/${data.bright_standard_lesson_id}`
      : `${BS_SITE}/hub?q=${encodeURIComponent(data.tpt_title || '')}`
  } else {
    cta.textContent = 'Find certified alternatives →'
    improve.style.display = 'inline-block'
    improve.onclick = () => {
      window.open(`${BS_SITE}/creators/improve?url=${encodeURIComponent(window.location.href)}`, '_blank')
    }
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function init() {
  // Only run on product pages
  if (!window.location.pathname.includes('/Product/')) return

  // Inject panel
  const panel = createPanel()
  document.body.appendChild(panel)

  // Close button
  panel.querySelector('.bs-close').addEventListener('click', () => {
    panel.classList.add('bs-hidden')
  })

  // Scrape
  const payload = scrapePage()

  try {
    const res = await fetch(SCORE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) throw new Error(`API ${res.status}`)

    const data = await res.json()

    if (data.error) {
      throw new Error(data.error)
    }

    renderScores({ ...data, tpt_title: payload.title })

  } catch (err) {
    console.error('[Bright Standard]', err)
    document.getElementById('bs-loading').style.display = 'none'
    document.getElementById('bs-error').style.display = 'block'
  }
}

// Small delay so TPT's React app finishes rendering
setTimeout(init, 1500)
