/* ═══════════════════════════════════════════════
   Router
═══════════════════════════════════════════════ */
const PAGES = ['home','block1','block2','block3','hub','section1','section2','section3','test','block8'];
const CHAPTER_NAMES = {
  home:     '',
  block1:   'Блок 1. Философия Гостемании',
  block2:   'Блок 2. Алгоритм ДОБРО',
  block3:   'Блок 3. Работа с инцидентами',
  hub:      'Блок 4. Замена и комплемент',
  section1: '4.1 Замена + Комплемент',
  section2: '4.2 Комплемент',
  section3: '4.3 Особые случаи',
  test:     'Блок 5. Итоговый тест',
  block8:   'Блок 6. Заключение',
};
const CHAPTER_ORDER = ['block1','block2','block3','hub','test','block8'];
const hubDone = [false, false, false];
let currentPage = 'home';
let unlockedChapters = 1;            // сколько глав открыто на главной (1..6)
let testPassed = false;             // сдан ли итоговый тест (гейт перед «Заключением»)

function navigateTo(pageId) {
  // Ставим на паузу любые медиа на покидаемой странице
  if (pageId !== currentPage) stopMediaIn(document.getElementById('page-' + currentPage));

  PAGES.forEach(id => {
    const el = document.getElementById('page-' + id);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById('page-' + pageId);
  if (!target) return;
  target.classList.add('active');
  currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'instant' });

  const idx = CHAPTER_ORDER.indexOf(pageId);
  const inHub = ['section1','section2','section3'].includes(pageId);
  document.getElementById('nav-chapter').textContent = CHAPTER_NAMES[pageId] || '';
  if (idx !== -1) {
    document.getElementById('nav-progress').textContent = (idx + 1) + ' / ' + CHAPTER_ORDER.length;
    document.getElementById('progress-bar').style.width = Math.round(((idx + 1) / CHAPTER_ORDER.length) * 100) + '%';
  } else if (inHub) {
    const hi = CHAPTER_ORDER.indexOf('hub');
    document.getElementById('nav-progress').textContent = (hi + 1) + ' / ' + CHAPTER_ORDER.length;
    document.getElementById('progress-bar').style.width = Math.round(((hi + 1) / CHAPTER_ORDER.length) * 100) + '%';
  } else {
    document.getElementById('nav-progress').textContent = '';
    document.getElementById('progress-bar').style.width = '0%';
  }

  updateBackBtn(pageId);
  setTimeout(initFadeIn, 50);

  if (pageId === 'block1')   initBiteScrolly();
  if (pageId === 'block2')   initGallery();
  if (pageId === 'block3')   initBlock3();
  if (pageId === 'hub')      applyHubLocks();
  if (pageId === 'section1') initSection1Warmup();
  if (pageId === 'section2') initSection2Warmup();
  if (pageId === 'section3') initSection3Warmup();
  if (pageId === 'test')     initTest();

  // Последовательная разблокировка глав на главной + запись в SCORM.
  // Особый случай: посещение теста НЕ открывает «Заключение» — оно
  // открывается только после сдачи теста (см. passTest()).
  const ci = CHAPTER_ORDER.indexOf(pageId);
  if (ci !== -1) {
    const bump = (pageId === 'test') ? 1 : 2;           // тест не разблокирует block8
    const newUnlocked = Math.min(ci + bump, CHAPTER_ORDER.length);
    if (newUnlocked > unlockedChapters) { unlockedChapters = newUnlocked; saveProgress(); }
    applyHomeLocks();
  }
}

/* ═══════════════════════════════════════════════
   Кнопка «Назад» в шапке — к предыдущей главе
═══════════════════════════════════════════════ */
function navBack() {
  if (['section1','section2','section3'].includes(currentPage)) { navigateTo('hub'); return; }
  const idx = CHAPTER_ORDER.indexOf(currentPage);
  if (idx > 0) navigateTo(CHAPTER_ORDER[idx - 1]);
  else navigateTo('home');
}

function updateBackBtn(pageId) {
  const btn = document.getElementById('nav-back-btn');
  if (!btn) return;
  const idx = CHAPTER_ORDER.indexOf(pageId);
  const isSection = ['section1','section2','section3'].includes(pageId);
  const label = document.getElementById('nav-back-label');
  // Прячем на главной и на первой главе (возвращаться некуда)
  const show = isSection || idx > 0;
  btn.style.display = show ? 'inline-flex' : 'none';
  if (label && show) {
    if (isSection) label.textContent = 'К разделам';
    else label.textContent = CHAPTER_NAMES[CHAPTER_ORDER[idx - 1]]?.split('.')[0] || 'Назад';
  }
}

/* ═══════════════════════════════════════════════
   Fade-in on scroll
═══════════════════════════════════════════════ */
function initFadeIn() {
  const els = document.querySelectorAll('.page.active .fade-in:not(.visible)');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add('visible');
    else io.observe(el);
  });
}

/* ═══════════════════════════════════════════════
   Gallery – Block 2
═══════════════════════════════════════════════ */
let galleryIdx = 0;
const GALLERY_COUNT = 5;

function initGallery() { galleryIdx = 0; renderGallery(); }
function renderGallery() {
  const track = document.getElementById('gallery-track');
  if (!track) return;
  track.style.transform = `translateX(-${galleryIdx * 100}%)`;
  document.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === galleryIdx));
}
function galleryMove(dir) {
  galleryIdx = (galleryIdx + dir + GALLERY_COUNT) % GALLERY_COUNT;
  renderGallery();
}

/* ═══════════════════════════════════════════════
   FAQ Accordion
═══════════════════════════════════════════════ */
function toggleFaq(btn) {
  const body = btn.nextElementSibling;
  const isOpen = body.classList.contains('open');
  btn.classList.toggle('open', !isOpen);
  body.classList.toggle('open', !isOpen);
}

/* ═══════════════════════════════════════════════
   Block 3 – Инициализация тренажёра (упр. А + Б + видео)
═══════════════════════════════════════════════ */
function initBlock3() {
  // Сброс видимости шагов при каждом входе
  document.getElementById('exercise-b')?.classList.add('hidden');
  document.getElementById('exa-next')?.style.setProperty('display', 'none');
  document.getElementById('exb-next')?.style.setProperty('display', 'none');
  document.getElementById('video-section')?.classList.add('hidden');
  clearFeedback('exa-feedback');
  clearFeedback('sort-feedback');

  // Упражнение А — два столбца
  resetZonePool('exa-pool', 'exa-zone-help', 'exa-zone-bad');
  initZoneSort('exa-pool', 'exa-zone-help', 'exa-zone-bad');
  // Упражнение Б — порядок фрагментов
  initSortable();
  // Видеотренажёр
  initVideoQuiz();
}

/* ═══════════════════════════════════════════════
   Block 3 – Упражнение А: фразы по двум столбцам
═══════════════════════════════════════════════ */
function checkExA() {
  const help = [...document.getElementById('exa-zone-help').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const bad  = [...document.getElementById('exa-zone-bad').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const cHelp = ['help1','help2','help3'];
  const cBad  = ['bad1','bad2','bad3'];
  const setEq = (a,b) => a.length === b.length && a.every(v => b.includes(v));
  const ok = setEq(help, cHelp) && setEq(bad, cBad);
  const fb = document.getElementById('exa-feedback');
  fb.className = 'feedback-box show ' + (ok ? 'correct' : 'incorrect');
  fb.innerHTML = ok
    ? '<strong>Верно!</strong> Помогают фразы, где ты признаёшь проблему, действуешь и благодаришь за обратную связь. Оправдания, отговорки и перекладывание ожидания на Гостя — только злят.'
    : '<strong>Почти.</strong> Помогают фразы, где ты признаёшь проблему, решаешь её и благодаришь. Оправдания («много заказов», «повара не справляются»), отговорки и «подождите ещё» — усугубляют.';
  document.getElementById('exa-next').style.display = 'block';
}

/* Показать упражнение Б */
function revealExB() {
  const ex = document.getElementById('exercise-b');
  if (ex) { ex.classList.remove('hidden'); ex.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  document.getElementById('exa-next').style.display = 'none';
}

/* Показать видеотренажёр (после упр. Б) */
function revealMoodTrainer() {
  const vs = document.getElementById('video-section');
  if (vs) {
    vs.classList.remove('hidden');
    setTimeout(initFadeIn, 50);
  }
  document.getElementById('exb-next').style.display = 'none';
}

/* ═══════════════════════════════════════════════
   Block 3 – Упражнение Б: порядок фрагментов
═══════════════════════════════════════════════ */
const CORRECT_ORDER = [0, 1, 2, 3, 4]; // верный порядок фрагментов (по data-idx)

function initSortable() {
  const list = document.getElementById('sortable-list');
  if (!list) return;
  let dragEl = null;

  // Перемешиваем при каждом входе; обработчики вешаем один раз
  shuffleChildren(list);
  if (list.dataset.sortBound) return;
  list.dataset.sortBound = '1';

  list.querySelectorAll('.sort-item').forEach(item => {
    item.addEventListener('dragstart', () => {
      dragEl = item;
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over-top','drag-over-bottom'));
      dragEl = null;
    });
    item.addEventListener('touchstart', e => {
      dragEl = item;
      item.classList.add('dragging');
    }, { passive: true });
    item.addEventListener('touchmove', e => {
      if (!dragEl) return;
      const y = e.touches[0].clientY;
      const els = [...list.querySelectorAll('.sort-item:not(.dragging)')];
      let target = null, before = true;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (y < r.top + r.height / 2) { target = el; before = true; break; }
        target = el; before = false;
      }
      list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over-top','drag-over-bottom'));
      if (target) target.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
    }, { passive: true });
    item.addEventListener('touchend', e => {
      if (!dragEl) return;
      const y = e.changedTouches[0].clientY;
      const els = [...list.querySelectorAll('.sort-item:not(.dragging)')];
      let target = null, before = true;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (y < r.top + r.height / 2) { target = el; before = true; break; }
        target = el; before = false;
      }
      if (target) {
        if (before) list.insertBefore(dragEl, target);
        else target.insertAdjacentElement('afterend', dragEl);
      }
      dragEl.classList.remove('dragging');
      list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over-top','drag-over-bottom'));
      dragEl = null;
    });
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    if (!dragEl) return;
    const after = getDragAfterEl(list, e.clientY);
    list.querySelectorAll('.sort-item').forEach(i => i.classList.remove('drag-over-top','drag-over-bottom'));
    if (after) after.classList.add('drag-over-top');
    else {
      const last = list.querySelector('.sort-item:last-child');
      if (last && last !== dragEl) last.classList.add('drag-over-bottom');
    }
  });
  list.addEventListener('drop', e => {
    e.preventDefault();
    if (!dragEl) return;
    const after = getDragAfterEl(list, e.clientY);
    if (after) list.insertBefore(dragEl, after);
    else list.appendChild(dragEl);
  });
}

function getDragAfterEl(container, y) {
  const items = [...container.querySelectorAll('.sort-item:not(.dragging)')];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, el: child };
    return closest;
  }, { offset: -Infinity, el: null }).el;
}

function checkSortOrder() {
  const list = document.getElementById('sortable-list');
  const items = [...list.querySelectorAll('.sort-item')];
  const indices = items.map(el => parseInt(el.dataset.idx));
  const isCorrect = CORRECT_ORDER.every((v, i) => v === indices[i]);

  const fb = document.getElementById('sort-feedback');
  fb.className = 'feedback-box show ' + (isCorrect ? 'correct' : 'incorrect');
  fb.innerHTML = isCorrect
    ? '<strong>Верно!</strong> Сначала признаём правоту Гостя, ускоряем заказ, извиняемся, решаем проблему с комплементом и благодарим за обратную связь.'
    : '<strong>Не совсем.</strong> Правильный порядок: сначала признать правоту Гостя, затем проверить заказ, извиниться, решить проблему с комплементом и в конце — поблагодарить за обратную связь.';

  const nextBtn = document.getElementById('exb-next');
  if (nextBtn) nextBtn.style.display = 'block';
}

/* ═══════════════════════════════════════════════
   Block 3 – Video mood quiz
═══════════════════════════════════════════════ */
let videoStep = 0;
const VIDEO_ANSWERS = ['спокойный', 'расстроенный', 'злой'];
const VIDEO_FEEDBACK = [
  '✓ Верно — это спокойный Гость. Ему важно сочувствие и признание проблемы.',
  '✓ Верно — это расстроенный Гость. Ему нужна скорость и уважение к его времени.',
  '✓ Верно — это злой / раздражённый Гость. Признай его правоту и дай выговориться.',
];

function initVideoQuiz() {
  videoStep = 0;
  document.querySelectorAll('#video-section .answer-btn').forEach(b => { b.disabled = false; b.classList.remove('correct', 'wrong'); });
  document.querySelectorAll('#video-section .vq-feedback').forEach(f => { f.classList.remove('show'); f.textContent = ''; });
  document.querySelectorAll('#video-section .vq-next').forEach(b => b.style.display = 'none');
  showVideoStep(0);
}
function showVideoStep(n) {
  document.querySelectorAll('.video-quiz-step').forEach((el, i) => el.classList.toggle('active', i === n));
  if (n >= 3) {
    const done = document.getElementById('video-quiz-done');
    if (done) {
      done.classList.remove('hidden');
      // The results start hidden, so their fade-in elements were not observed
      // when the video trainer first opened. Reveal them with the results.
      done.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    }
  }
}
function answerVideo(btn, stepIdx, answer) {
  if (btn.classList.contains('correct')) return;
  if (answer === VIDEO_ANSWERS[stepIdx]) {
    btn.classList.add('correct');
    btn.closest('.answer-choices').querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    const fb = document.getElementById('vq-fb-' + stepIdx);
    if (fb) { fb.textContent = VIDEO_FEEDBACK[stepIdx]; fb.classList.add('show'); }
    // Показываем кнопку «Далее» — следующее видео не появляется само,
    // чтобы можно было прочитать обратную связь.
    const nextBtn = document.getElementById('vq-next-' + stepIdx);
    if (nextBtn) nextBtn.style.display = 'inline-flex';
  } else {
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 600);
  }
}
function nextVideoStep() {
  videoStep++;
  showVideoStep(videoStep);
}

/* ═══════════════════════════════════════════════
   Two-zone drag-and-drop
═══════════════════════════════════════════════ */
function initZoneSort(poolId, zone1Id, zone2Id) {
  const pool = document.getElementById(poolId);
  const z1   = document.getElementById(zone1Id);
  const z2   = document.getElementById(zone2Id);
  if (!pool || !z1 || !z2) return;

  [pool, z1, z2].forEach(container => {
    container.querySelectorAll('.drag-chip').forEach(chip => {
      if (!chip.dataset.chipBound) { bindChip(chip, pool, z1, z2); chip.dataset.chipBound = '1'; }
    });
  });
  [pool, z1, z2].forEach(zone => {
    if (zone.dataset.zoneBound) return;
    zone.dataset.zoneBound = '1';
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const chip = document.getElementById(id);
      if (chip) zone.appendChild(chip);
    });
  });
}

/* Перемешать дочерние элементы (для разминок — чтобы карточки не шли группами) */
function shuffleChildren(el) {
  if (!el) return;
  const kids = [...el.children];
  for (let i = kids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kids[i], kids[j]] = [kids[j], kids[i]];
  }
  kids.forEach(k => el.appendChild(k));
}

/* Вернуть все чипы в пул и перемешать */
function resetZonePool(poolId, ...zoneIds) {
  const pool = document.getElementById(poolId);
  if (!pool) return;
  zoneIds.forEach(zid => {
    const z = document.getElementById(zid);
    if (z) [...z.querySelectorAll('.drag-chip')].forEach(c => pool.appendChild(c));
  });
  shuffleChildren(pool);
}

function bindChip(chip, pool, z1, z2) {
  chip.setAttribute('draggable', true);
  chip.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', chip.id); chip.classList.add('dragging'); });
  chip.addEventListener('dragend',   () => chip.classList.remove('dragging'));

  let touchClone = null;
  chip.addEventListener('touchstart', () => {
    chip.classList.add('dragging');
    touchClone = chip.cloneNode(true);
    touchClone.style.cssText = 'position:fixed;pointer-events:none;opacity:0.75;z-index:9999;transition:none;';
    document.body.appendChild(touchClone);
  }, { passive: true });
  chip.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (touchClone) { touchClone.style.left = (t.clientX - 40) + 'px'; touchClone.style.top = (t.clientY - 20) + 'px'; }
    [pool, z1, z2].forEach(z => {
      const r = z.getBoundingClientRect();
      z.classList.toggle('drag-over', t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
    });
  }, { passive: true });
  chip.addEventListener('touchend', e => {
    chip.classList.remove('dragging');
    if (touchClone) { touchClone.remove(); touchClone = null; }
    const t = e.changedTouches[0];
    [pool, z1, z2].forEach(z => {
      z.classList.remove('drag-over');
      const r = z.getBoundingClientRect();
      if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) z.appendChild(chip);
    });
  });
}

function checkZone(poolId, zone1Id, zone2Id, correctZ1, correctZ2, feedbackId, nextId) {
  const z1 = [...document.getElementById(zone1Id).querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const z2 = [...document.getElementById(zone2Id).querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const setEq = (a, b) => a.length === b.length && a.every(v => b.includes(v));
  const ok = setEq(z1, correctZ1) && setEq(z2, correctZ2);
  const fb = document.getElementById(feedbackId);
  if (!fb) return;
  fb.className = 'feedback-box show ' + (ok ? 'correct' : 'incorrect');
  fb.innerHTML = ZONE_FEEDBACK[feedbackId]?.[ok ? 'correct' : 'incorrect'] || (ok ? '<strong>Верно!</strong>' : '<strong>Неверно.</strong>');
  if (nextId) { const n = document.getElementById(nextId); if (n) n.classList.remove('hidden'); }
}

const ZONE_FEEDBACK = {
  'zone1-feedback': {
    correct: '<strong>Верно!</strong> Ты уже чувствуешь разницу: проблемы с едой требуют замены + комплемента, а проблемы сервиса — только комплемента.',
    incorrect: '<strong>Неверно.</strong> Проблемы с едой (холодная, не тот вкус, пересол) → <strong>замена + комплемент</strong>. Проблемы сервиса (ожидание, чистота, грубость) → <strong>комплемент</strong>.',
  },
  'zone3-feedback': {
    correct: '<strong>Верно!</strong> Сохраняй спокойствие, ссылайся на правила и при необходимости зови руководителя.',
    incorrect: '<strong>Неверно.</strong> Сохранять спокойный тон, ссылаться на правила учёта, предлагать руководителя, фиксировать инцидент — правильно. Обвинения, споры, игнорирование — недопустимо.',
  },
};

/* ═══════════════════════════════════════════════
   Section 2 – Matching quiz (standalone page)
═══════════════════════════════════════════════ */
const MATCH_ANSWERS = ['десерт', 'напиток-десерт', 'бургер-сет'];
let matchSolved = [false, false, false];

function pickMatch(btn, qIdx, answer) {
  if (matchSolved[qIdx]) return;
  if (answer === MATCH_ANSWERS[qIdx]) {
    btn.classList.add('correct-pick');
    matchSolved[qIdx] = true;
    btn.closest('.match-question').classList.add('solved');
    btn.closest('.match-question').querySelectorAll('.match-btn').forEach(b => b.disabled = true);
    if (matchSolved.every(Boolean)) {
      const fb = document.getElementById('match-feedback');
      if (fb) { fb.className = 'feedback-box show correct'; fb.innerHTML = '<strong>Верно!</strong> Дальше разберём комплементы подробнее.'; }
    }
  } else {
    btn.classList.add('wrong-pick');
    setTimeout(() => btn.classList.remove('wrong-pick'), 600);
  }
}

/* ═══════════════════════════════════════════════
   Разминки внутри подразделов (4.1 / 4.2 / 4.3)
═══════════════════════════════════════════════ */
let hubMatchSolved = [false, false, false];

function clearFeedback(id) {
  const fb = document.getElementById(id);
  if (fb) { fb.className = 'feedback-box'; fb.innerHTML = ''; }
}

/* Раздел 1 — сортировка жалоб по инструментам (в начале раздела) */
function initSection1Warmup() {
  resetZonePool('hub-pool1', 'hub-zone1a', 'hub-zone1b');
  initZoneSort('hub-pool1', 'hub-zone1a', 'hub-zone1b');
  clearFeedback('hub-ws0-feedback');
}
function checkHubWarmup0() {
  const z1 = [...document.getElementById('hub-zone1a').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const z2 = [...document.getElementById('hub-zone1b').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const cZ1 = ['ожидание','грязь','столик','нагрубили'];
  const cZ2 = ['холодный','сухая','пересолена','кола'];
  const setEq = (a,b) => a.length === b.length && a.every(v => b.includes(v));
  const ok = setEq(z1, cZ1) && setEq(z2, cZ2);
  const fb = document.getElementById('hub-ws0-feedback');
  fb.className = 'feedback-box show ' + (ok ? 'correct' : 'incorrect');
  fb.innerHTML = ok
    ? '<strong>Верно!</strong> Проблемы с едой → замена + комплемент. Проблемы с сервисом → только комплемент.'
    : '<strong>Неверно.</strong> Проблемы с едой (холодная, пересолена, не та) → <strong>замена + комплемент</strong>. Ожидание, грязь, грубость → <strong>комплемент</strong>.';
}

/* Раздел 2 — сопоставление комплементов (в начале раздела) */
function initSection2Warmup() {
  hubMatchSolved = [false, false, false];
  document.querySelectorAll('#page-section2 .match-btn').forEach(b => { b.disabled = false; b.classList.remove('correct-pick', 'wrong-pick'); });
  document.querySelectorAll('#page-section2 .match-question').forEach(q => q.classList.remove('solved'));
  clearFeedback('hub-ws1-feedback');
}
function pickHubMatch(btn, qIdx, answer) {
  if (hubMatchSolved[qIdx]) return;
  if (answer === MATCH_ANSWERS[qIdx]) {
    btn.classList.add('correct-pick');
    hubMatchSolved[qIdx] = true;
    btn.closest('.match-question').classList.add('solved');
    btn.closest('.match-question').querySelectorAll('.match-btn').forEach(b => b.disabled = true);
    if (hubMatchSolved.every(Boolean)) {
      const fb = document.getElementById('hub-ws1-feedback');
      fb.className = 'feedback-box show correct';
      fb.innerHTML = '<strong>Верно!</strong> Отлично — ты знаешь, какой комплемент соответствует каждой жалобе. Изучай раздел дальше.';
    }
  } else {
    btn.classList.add('wrong-pick');
    setTimeout(() => btn.classList.remove('wrong-pick'), 600);
  }
}

/* Раздел 3 — делать / не делать (в конце раздела) */
function initSection3Warmup() {
  resetZonePool('hub-pool3', 'hub-zone3a', 'hub-zone3b');
  initZoneSort('hub-pool3', 'hub-zone3a', 'hub-zone3b');
  clearFeedback('hub-ws2-feedback');
}
function checkHubWarmup2() {
  const z1 = [...document.getElementById('hub-zone3a').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const z2 = [...document.getElementById('hub-zone3b').querySelectorAll('.drag-chip')].map(c => c.dataset.key);
  const cDo   = ['спокойный-тон','правила','руководитель','зафиксировать'];
  const cDont = ['обвинять','обманываете','спорить','игнорировать'];
  const setEq = (a,b) => a.length === b.length && a.every(v => b.includes(v));
  const ok = setEq(z1, cDo) && setEq(z2, cDont);
  const fb = document.getElementById('hub-ws2-feedback');
  fb.className = 'feedback-box show ' + (ok ? 'correct' : 'incorrect');
  fb.innerHTML = ok
    ? '<strong>Верно!</strong> Именно так: сохраняй спокойствие и следуй правилам.'
    : '<strong>Неверно.</strong> Спокойный тон, правила, руководитель, фиксация — всё это правильные действия. Обвинения, споры, игнорирование — недопустимы.';
}

/* ═══════════════════════════════════════════════
   Hub section management
═══════════════════════════════════════════════ */
function goToSection(n) { navigateTo('section' + n); }

function completeSection(n) {
  hubDone[n - 1] = true;
  saveProgress();
  navigateTo('hub'); // applyHubLocks() вызывается внутри для ветки 'hub'
}

/* Состояние карточек хаба: done / locked + кнопка «Далее» */
function applyHubLocks() {
  const cards = document.querySelectorAll('#page-hub .hub-card');
  cards.forEach((card, i) => {
    card.classList.toggle('done', !!hubDone[i]);
    // 1-я карточка всегда открыта; 2-я — после 1-го раздела; 3-я — после 2-го
    const locked = i === 0 ? false : !hubDone[i - 1];
    card.classList.toggle('locked', locked);
  });
  if (hubDone.every(Boolean)) document.getElementById('hub-next-row')?.classList.add('show');
}

/* ═══════════════════════════════════════════════
   ДОБРО-колесо: модальное окно
═══════════════════════════════════════════════ */
const DOBRO_DATA = {
  people: {
    color: '#FF8732',
    title: 'Люди',
    text1: 'Сотрудники перестают бояться жалоб. Знают алгоритм — меньше стресса.',
    text2: 'Текучесть снижается. Уверенность растёт.'
  },
  product: {
    color: '#E89B1A',
    title: 'Продукт',
    text1: 'Каждая жалоба, списанная по ДОБРО, — сигнал для кухни.',
    text2: 'Меньше ошибок при приготовлении заказа = меньше списаний.'
  },
  sales: {
    color: '#2B7BB9',
    title: 'Продажи и Гости',
    text1: 'Решённый инцидент = Гость возвращается + приводит друзей.',
    text2: '1 спасённый Гость = несколько дополнительных чеков в месяц.'
  },
  clean: {
    color: '#198737',
    title: 'Чистота и оборудование',
    text1: 'Любая жалоба на грязь, решенная с помощью ДОБРО, ведет к анализу причин, а не просто к уборке «для галочки»',
    text2: 'Ресторан чище. Оборудование вовремя ремонтируют.'
  }
};

function openDoproModal(key) {
  const data = DOBRO_DATA[key];
  if (!data) return;
  document.getElementById('dobro-modal-icon').style.background = data.color;
  document.getElementById('dobro-modal-title').textContent = data.title;
  document.getElementById('dobro-modal-text1').textContent = data.text1;
  document.getElementById('dobro-modal-text2').textContent = data.text2;
  document.getElementById('dobro-modal-overlay').classList.add('open');
}

function closeDoproModal() {
  document.getElementById('dobro-modal-overlay').classList.remove('open');
}

// Закрытие по Esc
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDoproModal(); closeImageZoom(); }
});

/* ═══════════════════════════════════════════════
   Пауза медиа при переходе между страницами
   ───────────────────────────────────────────────
   <video>/<audio> ставим на pause(); встроенные плееры в <iframe>
   (PeerTube/BKTube и т.п.) останавливаем перезагрузкой src —
   это надёжно работает у любого провайдера.
═══════════════════════════════════════════════ */
function stopMediaIn(pageEl) {
  if (!pageEl) return;
  pageEl.querySelectorAll('video, audio').forEach(m => { try { m.pause(); } catch (e) {} });
  pageEl.querySelectorAll('iframe').forEach(f => {
    const src = f.getAttribute('src');
    if (src) f.setAttribute('src', src); // сброс src останавливает воспроизведение
  });
}

/* ═══════════════════════════════════════════════
   Увеличение изображения (zoom-модалка)
   ───────────────────────────────────────────────
   Картинку всегда показываем горизонтально: в портретной ориентации
   телефона CSS поворачивает её на 90° (см. .image-zoom__img в style.css).
═══════════════════════════════════════════════ */
function openImageZoom(src, alt) {
  const img = document.getElementById('image-zoom-img');
  if (img) { img.src = src; img.alt = alt || ''; }
  document.getElementById('image-zoom-overlay')?.classList.add('open');
}
function closeImageZoom() {
  document.getElementById('image-zoom-overlay')?.classList.remove('open');
}

/* ═══════════════════════════════════════════════
   Прогресс и SCORM
   ───────────────────────────────────────────────
   Состояние хранится в cmi.suspend_data (SCORM 1.2),
   а как запасной вариант — в localStorage (для просмотра
   вне LMS, например на GitHub Pages).
═══════════════════════════════════════════════ */
const PROGRESS_KEY = 'gostemania_progress';

function collectState() {
  return { unlocked: unlockedChapters, hub: hubDone.slice(), test: testPassed };
}

function saveProgress() {
  const json = JSON.stringify(collectState());
  try { localStorage.setItem(PROGRESS_KEY, json); } catch (e) {}
  if (window.SCORM && typeof SCORM.set === 'function') {
    SCORM.set('cmi.suspend_data', json);
    // Статус «Завершён» НЕ ставится автоматически — только кнопкой
    // «Завершить курс» (SCORM.complete()). Здесь лишь помечаем, что попытка
    // начата, и никогда не понижаем уже зачтённый статус (passed/completed).
    const status = SCORM.get('cmi.core.lesson_status');
    if (status === '' || status === 'not attempted' || status === 'unknown') {
      SCORM.set('cmi.core.lesson_status', 'incomplete');
    }
    SCORM.commit();
  }
}

function loadProgress() {
  let json = '';
  if (window.SCORM && typeof SCORM.get === 'function') {
    try { json = SCORM.get('cmi.suspend_data') || ''; } catch (e) {}
  }
  if (!json) { try { json = localStorage.getItem(PROGRESS_KEY) || ''; } catch (e) {} }
  if (json) {
    try {
      const s = JSON.parse(json);
      if (typeof s.unlocked === 'number') {
        unlockedChapters = Math.max(1, Math.min(s.unlocked, CHAPTER_ORDER.length));
      }
      if (Array.isArray(s.hub)) {
        for (let i = 0; i < hubDone.length; i++) hubDone[i] = !!s.hub[i];
      }
      if (typeof s.test === 'boolean') testPassed = s.test;
      // Если тест сдан — «Заключение» должно быть открыто
      if (testPassed) unlockedChapters = Math.max(unlockedChapters, CHAPTER_ORDER.length);
    } catch (e) {}
  }
  applyHomeLocks();
  applyHubLocks();
}

/* Замки на карточках глав главной страницы */
function applyHomeLocks() {
  CHAPTER_ORDER.forEach((ch, i) => {
    const card = document.getElementById('home-card-' + (i + 1));
    if (card) card.classList.toggle('locked', i >= unlockedChapters);
  });
}

/* ═══════════════════════════════════════════════
   Блок 1 — скролли-теллинг «стандарты = забота»
   ───────────────────────────────────────────────
   61 кадр WebP (images/bite-seq/) в липкой секции #bite-scrolly.
   Скролл переключает ТОЛЬКО карточки (шаги); анимация сама
   доигрывает свой отрезок до «опорного» кадра шага и отдыхает
   на нём — поэтому при чтении в кадре всегда осмысленная поза,
   а не случайный стоп-кадр посреди жевания.
═══════════════════════════════════════════════ */
const BITE_FRAMES = 61;
const BITE_STEPS  = 4;                    // число карточек
const BITE_REST   = [14, 30, 39, 60];     // опорный кадр для каждого шага
const BITE_FPS    = 14;                   // скорость доигрывания, кадров/сек
const biteImages  = [];
let biteInited    = false;
let biteLastDrawn = -1;                   // последний отрисованный кадр (int)
let biteFrameNow  = 0;                    // текущая позиция «плёнки» (float)
let biteTarget    = 0;                    // куда доигрываем
let biteStep      = -1;                   // активная карточка
let biteTimer     = null;                 // интервал доигрывания

function biteSrc(i) { return 'images/bite-seq/f_' + String(i + 1).padStart(2, '0') + '.webp'; }

function initBiteScrolly() {
  if (biteInited) { onBiteScroll(); return; }
  biteInited = true;
  // Предзагрузка кадров: первый кадр рисуем сразу, как только он готов
  for (let i = 0; i < BITE_FRAMES; i++) {
    const im = new Image();
    im.decoding = 'async';
    im.src = biteSrc(i);
    if (i === 0) im.onload = () => drawBiteFrame(0);
    biteImages.push(im);
  }
  window.addEventListener('scroll', onBiteScroll, { passive: true });
  window.addEventListener('resize', onBiteScroll, { passive: true });
  onBiteScroll();
}

/* Рисуем кадр idx; если он ещё не загрузился — ближайший загруженный до него */
function drawBiteFrame(idx) {
  const canvas = document.getElementById('bite-canvas');
  if (!canvas) return;
  let im = null;
  for (let i = idx; i >= 0; i--) {
    if (biteImages[i] && biteImages[i].complete && biteImages[i].naturalWidth) { im = biteImages[i]; break; }
  }
  if (!im) return;
  if (idx === biteLastDrawn && im === biteImages[idx]) return;   // кадр не изменился
  const ctx = canvas.getContext('2d');
  ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
  biteLastDrawn = idx;
}

/* Запустить доигрывание к целевому кадру (вперёд или назад).
   Таймер, а не rAF: не глохнет при троттлинге (фон, энергосбережение),
   а плавность при дискретных кадрах 14 fps не отличается. */
function biteSetTarget(frame) {
  biteTarget = frame;
  // Со сниженной анимацией — мгновенный переход на опорный кадр
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    biteFrameNow = frame;
    drawBiteFrame(frame);
    return;
  }
  if (biteTimer) return;   // уже доигрывает — цель просто обновилась
  const TICK_MS = 30;
  biteTimer = setInterval(() => {
    const delta = biteTarget - biteFrameNow;
    if (Math.abs(delta) < 0.01) {
      biteFrameNow = biteTarget;
      clearInterval(biteTimer);
      biteTimer = null;
      return;
    }
    const move = Math.sign(delta) * Math.min(Math.abs(delta), BITE_FPS * TICK_MS / 1000);
    biteFrameNow += move;
    drawBiteFrame(Math.round(biteFrameNow));
  }, TICK_MS);
}

function onBiteScroll() {
  if (currentPage !== 'block1') return;
  const section = document.getElementById('bite-scrolly');
  if (!section) return;
  const rect = section.getBoundingClientRect();
  // Пока секция не видна — не трогаем анимацию (bite сыграет на глазах у пользователя)
  if (rect.top > window.innerHeight || rect.bottom < 0) return;
  const scrollable = rect.height - window.innerHeight;
  if (scrollable <= 0) return;
  // 0 — секция только прилипла, 1 — долистали до конца
  const progress = Math.min(1, Math.max(0, -rect.top / scrollable));

  // Активный шаг: карточки + прогресс-точки + цель анимации
  const step = Math.min(BITE_STEPS - 1, Math.floor(progress * BITE_STEPS));
  if (step !== biteStep) {
    biteStep = step;
    document.querySelectorAll('#bite-card-stack .bite-card').forEach((c, i) =>
      c.classList.toggle('active', i === step));
    document.querySelectorAll('#bite-progress .bite-progress__dot').forEach((d, i) =>
      d.classList.toggle('active', i <= step));
    biteSetTarget(BITE_REST[step]);
  }

  // Подсказка исчезает ближе к концу
  document.querySelector('.bite-hint')?.classList.toggle('gone', progress > 0.85);
}

/* ═══════════════════════════════════════════════
   Итоговый тест (Блок 5)
   ───────────────────────────────────────────────
   Порог сдачи — 80% (8 из 10). При провале — заново.
   Варианты внутри вопроса перемешиваются, чтобы «правильные»
   не оказывались всегда сверху. multi — несколько верных.
═══════════════════════════════════════════════ */
const TEST_PASS_RATIO = 0.8;

const TEST_QUESTIONS = [
  { q: 'Какие ситуации относятся к критическому уровню инцидента?', multi: true,
    options: [
      { t: 'Насекомое в ресторане', correct: true },
      { t: 'Кража имущества', correct: true },
      { t: 'Грубость сотрудника', correct: true },
      { t: 'Долгое ожидание заказа более 8 минут', correct: false },
      { t: 'Холодный бургер', correct: false },
    ] },
  { q: 'Почему при инциденте нужно выдавать Гостю комплемент?', multi: true,
    options: [
      { t: 'Это помогает сохранить лояльность Гостя', correct: true },
      { t: 'Потерять Гостя дороже, чем подарить комплемент', correct: true },
      { t: 'Чтобы Гости чувствовали нашу заботу', correct: true },
      { t: 'Для выполнения плана по комплементам', correct: false },
      { t: 'Это требование Компании, которое нужно соблюдать', correct: false },
    ] },
  { q: 'Гость жалуется, что ему выдали холодный сэндвич. Что должен сделать сотрудник?', multi: true,
    options: [
      { t: 'Извиниться', correct: true },
      { t: 'Заменить блюдо', correct: true },
      { t: 'Предложить комплемент', correct: true },
      { t: 'Объяснить, что температура соответствует стандарту', correct: false },
      { t: 'Предложить приобрести новый сэндвич', correct: false },
    ] },
  { q: 'Гость спокойно говорит: «Котлета сухая». Как лучше начать разговор?', multi: false,
    options: [
      { t: '«Я понимаю Вас. Давайте разберёмся, что именно не так».', correct: true },
      { t: '«Нам жаль, что Вы расстроены. Наши котлеты готовятся на огне и небольшая сухость — это нормально».', correct: false },
      { t: '«Подскажите, сколько времени прошло после получения Вашего заказа?»', correct: false },
      { t: '«Простите нас, пожалуйста, я сейчас же позову руководителя».', correct: false },
    ] },
  { q: 'Гость регулярно требует комплемент без объективной причины. Как следует поступить?', multi: true,
    options: [
      { t: 'Сохранять спокойствие', correct: true },
      { t: 'Сослаться на правила предоставления комплементов', correct: true },
      { t: 'При необходимости пригласить руководителя', correct: true },
      { t: 'Вежливо попросить Гостя уйти', correct: false },
      { t: 'Вступить с Гостем в спор', correct: false },
    ] },
  { q: 'Во время сборки заказа ты заметил ошибку в приготовлении закуски. Что следует сделать?', multi: false,
    options: [
      { t: 'Переделать блюдо и оформить списание', correct: true },
      { t: 'Выдать заказ как есть', correct: false },
      { t: 'Переделать блюдо без списания', correct: false },
      { t: 'Спросить у Гостя, готов ли он подождать исправления', correct: false },
    ] },
  { q: 'Что должен сделать сотрудник на шаге «Отметь важность обратной связи» алгоритма ДОБРО?', multi: false,
    options: [
      { t: 'Поблагодарить Гостя за обращение', correct: true },
      { t: 'Объяснить причину ошибки', correct: false },
      { t: 'Предложить комплемент', correct: false },
      { t: 'Передать жалобу руководителю', correct: false },
    ] },
  { q: 'Определять настроение Гостя нужно для того, чтобы…', multi: false,
    options: [
      { t: '…подобрать подходящие слова и способ решения ситуации', correct: true },
      { t: '…определить, нужно ли выдать комплемент', correct: false },
      { t: '…понять, нужно ли предоставлять замену блюда и оформлять списание', correct: false },
      { t: '…дать понять Гостю, что его услышали', correct: false },
    ] },
  { q: 'В зале ты заметил грязный столик раньше, чем на него обратил внимание Гость. Что следует сделать?', multi: true,
    options: [
      { t: 'Немедленно убрать столик', correct: true },
      { t: 'Проверить чистоту соседних столов', correct: true },
      { t: 'Позаботиться о том, чтобы следующий Гость сел за чистый стол', correct: true },
      { t: 'Дождаться замечания от Гостя', correct: false },
      { t: 'Проверить график уборки', correct: false },
    ] },
  { q: 'Гость говорит, что ему не нравится внешний вид сэндвича. На твой взгляд, сэндвич собран правильно. Как поступишь?', multi: false,
    options: [
      { t: 'Уточню, что именно не нравится Гостю, и доверюсь его мнению. Предложу переделать блюдо и выдам комплемент', correct: true },
      { t: 'Объясню, что блюдо выглядит хорошо и приготовлено по стандартам, предложу десерт в качестве комплемента', correct: false },
      { t: 'Объясню, что блюдо приготовлено правильно, и предложу заказать другой сэндвич', correct: false },
      { t: 'Расскажу, что внешний вид блюда может отличаться от изображения в меню, это нормально', correct: false },
    ] },
];

// Порядок вариантов на текущую попытку (перемешивается при initTest)
let testOptionOrder = [];

/* ═══════════════════════════════════════════════
   Логирование попыток теста в Google Таблицу
   ───────────────────────────────────────────────
   ГЛАВНОЕ ПРАВИЛО: эта отправка НИКОГДА не должна влиять на
   прохождение курса — ни скоростью, ни сбоем. Поэтому:
     • fetch без await — вызывающий код (checkTest) не ждёт ответа
       и продолжает выполняться мгновенно;
     • mode:'no-cors' — мы всё равно не читаем ответ, поэтому не
       ждём и не проверяем его; сама отправка не требует preflight
       (Content-Type: text/plain — «simple request»);
     • .catch(()=>{}) — сетевая ошибка, таймаут, заблокированный
       прокси или недоступный скрипт молча игнорируются;
     • try/catch снаружи — даже ошибка при СБОРКЕ запроса не
       выйдет за пределы функции;
     • если GOOGLE_SHEET_ENDPOINT пуст — функция ничего не делает.
   Из-за mode:'no-cors' мы не можем узнать, дошли ли данные —
   это осознанный компромисс ради «не блокирует и не роняет».
═══════════════════════════════════════════════ */
const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwA_o6jGPhxRKZb7b0Mv1_M4K1pp6NAScxoxK0jH3yWk5cgWSbibDdaLo-Iu_n3MP7Y/exec';
const GOOGLE_SHEET_SECRET   = 'gostemania-2026'; // должен совпадать с SHARED_SECRET в скрипте Apps Script

// Номер попытки — считается в рамках вкладки (переживает refresh через sessionStorage)
let testAttemptNum = (() => {
  try { return parseInt(sessionStorage.getItem('gostemania_test_attempt') || '0', 10) || 0; }
  catch (e) { return 0; }
})();

// ID сессии прохождения — просто чтобы группировать попытки одного захода
const testSessionId = (() => {
  try {
    let id = sessionStorage.getItem('gostemania_session_id');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('gostemania_session_id', id); }
    return id;
  } catch (e) { return 'nosession-' + Date.now(); }
})();

function logTestAttempt(perQuestion, correctCount, total, passed) {
  if (!GOOGLE_SHEET_ENDPOINT) return; // не настроено — тихо выходим, курс не в курсе о существовании этой функции

  try {
    testAttemptNum++;
    try { sessionStorage.setItem('gostemania_test_attempt', String(testAttemptNum)); } catch (e) {}

    let studentId = '', studentName = '';
    if (window.SCORM && typeof SCORM.get === 'function') {
      try { studentId = SCORM.get('cmi.core.student_id') || ''; } catch (e) {}
      try { studentName = SCORM.get('cmi.core.student_name') || ''; } catch (e) {}
    }

    const payload = {
      secret: GOOGLE_SHEET_SECRET,
      timestamp: new Date().toISOString(),
      session_id: testSessionId,
      attempt: testAttemptNum,
      student_id: studentId,
      student_name: studentName,
      score: correctCount,
      total: total,
      passed: passed ? 'да' : 'нет',
    };
    perQuestion.forEach((q, i) => {
      payload['q' + (i + 1) + '_answer']  = q.answerText;
      payload['q' + (i + 1) + '_correct'] = q.correct ? 'да' : 'нет';
    });

    fetch(GOOGLE_SHEET_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // без preflight-запроса
      body: JSON.stringify(payload),
    }).catch(() => {}); // сеть недоступна / прокси заблокировал / скрипт упал — игнорируем
  } catch (e) {
    // Что бы здесь ни пошло не так — тест уже засчитан выше, это не должно всплыть
  }
}

function initTest() {
  // Порядок вариантов перемешиваем заново на каждую попытку
  testOptionOrder = TEST_QUESTIONS.map(qq => shuffledIndices(qq.options.length));
  renderTest();
  document.getElementById('test-result').className = 'feedback-box';
  document.getElementById('test-result').innerHTML = '';
  document.getElementById('test-retake-row').style.display = 'none';
  document.getElementById('test-pass-row').style.display = testPassed ? 'block' : 'none';
  document.getElementById('test-submit').style.display = 'inline-flex';
}

function shuffledIndices(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function renderTest() {
  const box = document.getElementById('test-questions');
  if (!box) return;
  box.innerHTML = TEST_QUESTIONS.map((qq, qi) => {
    const hint = qq.multi ? 'Выбери все верные варианты' : 'Выбери один вариант';
    const opts = testOptionOrder[qi].map(oi => {
      const inputType = qq.multi ? 'checkbox' : 'radio';
      return `<label class="test-option">
        <input type="${inputType}" name="tq-${qi}" value="${oi}">
        <span>${qq.options[oi].t}</span>
      </label>`;
    }).join('');
    return `<div class="test-question" id="test-q-${qi}">
      <p class="test-q-title"><span class="test-q-num">${qi + 1}</span>${qq.q}</p>
      <p class="test-q-hint">${hint}</p>
      <div class="test-options">${opts}</div>
    </div>`;
  }).join('');
}

function checkTest() {
  let correctCount = 0;
  const perQuestion = [];   // для логирования попытки — см. logTestAttempt()
  TEST_QUESTIONS.forEach((qq, qi) => {
    const chosen = [...document.querySelectorAll(`input[name="tq-${qi}"]:checked`)].map(i => parseInt(i.value));
    const correctSet = qq.options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0);
    const ok = chosen.length === correctSet.length && chosen.every(v => correctSet.includes(v));
    if (ok) correctCount++;
    const qEl = document.getElementById('test-q-' + qi);
    if (qEl) { qEl.classList.remove('q-correct', 'q-wrong'); qEl.classList.add(ok ? 'q-correct' : 'q-wrong'); }
    perQuestion.push({
      answerText: chosen.length ? chosen.map(i => qq.options[i].t).join('; ') : '(не отвечено)',
      correct: ok,
    });
  });

  const total = TEST_QUESTIONS.length;
  const passed = correctCount / total >= TEST_PASS_RATIO;
  const result = document.getElementById('test-result');
  result.className = 'feedback-box show ' + (passed ? 'correct' : 'incorrect');

  if (passed) {
    testPassed = true;
    unlockedChapters = Math.max(unlockedChapters, CHAPTER_ORDER.length); // открываем «Заключение»
    saveProgress();
    applyHomeLocks();
    result.innerHTML = `<strong>Тест сдан!</strong> Верных ответов: ${correctCount} из ${total}. Заключение открыто.`;
    document.getElementById('test-submit').style.display = 'none';
    document.getElementById('test-retake-row').style.display = 'none';
    document.getElementById('test-pass-row').style.display = 'block';
  } else {
    result.innerHTML = `<strong>Пока не сдан.</strong> Верных ответов: ${correctCount} из ${total}. Нужно минимум ${Math.ceil(total * TEST_PASS_RATIO)}. Отмеченные красным вопросы — с ошибкой. Попробуй ещё раз.`;
    document.getElementById('test-retake-row').style.display = 'block';
    document.getElementById('test-pass-row').style.display = 'none';
  }
  result.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Отправка попытки в Google Таблицу — строго последним шагом.
  // Курс к этому моменту уже полностью обновил UI и SCORM;
  // logTestAttempt() асинхронна и ни при каких условиях не блокирует
  // и не может сломать прохождение (см. её описание ниже).
  logTestAttempt(perQuestion, correctCount, total, passed);
}

function retakeTest() {
  initTest();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════
   Init on load
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  navigateTo('home');
  applyHomeLocks();
});
// SCORM API инициализируется на событие 'load' (scorm_api.js),
// поэтому восстанавливаем прогресс тоже здесь — после инициализации.
window.addEventListener('load', loadProgress);
