/* ==========================
   Pixel Neuroanatomy Mapper — Researchy Edition
   ========================== */

/* ---- Config & Canvas ---- */
const TILE = 16;
const GRID_W = 60, GRID_H = 45;
const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
const CANVAS_W = GRID_W * TILE, CANVAS_H = GRID_H * TILE;

const canvas = document.getElementById('brain');
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
const tooltip = document.getElementById('tooltip');
const legendEl = document.getElementById('legend');
const gridToggle = document.getElementById('gridToggle');
const dominanceSel = document.getElementById('dominance');
const resetBtn = document.getElementById('resetBtn');
const studyBtn = document.getElementById('studyBtn');

const tabs = [...document.querySelectorAll('.tab')];
const panes = {
  overview: document.getElementById('pane-overview'),
  clinical: document.getElementById('pane-clinical'),
  research: document.getElementById('pane-research'),
  fun:      document.getElementById('pane-fun'),
};

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const cardFront = document.getElementById('cardFront');
const cardBack  = document.getElementById('cardBack');
const revealBtn = document.getElementById('revealBtn');
const quizQ = document.getElementById('quizQ');
const quizChoices = document.getElementById('quizChoices');
const quizFeedback = document.getElementById('quizFeedback');
const nextQBtn = document.getElementById('nextQ');
const restartQBtn = document.getElementById('restartQ');
const timerEl = document.getElementById('timer');

let showGrid = false;
let mode = 'arterial';
let dominance = 'L';
let hoverKey = null;
let pinnedKey = null;

function setupCanvas() {
  canvas.width = CANVAS_W * DPR;
  canvas.height = CANVAS_H * DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
setupCanvas();

/* ---- Palettes ---- */
const PALETTES = {
  arterial: {'ACA (L)':'#98c9ff','MCA (L)':'#6fa0ff','PCA (L)':'#aab1ff','ACA (R)':'#ffd49b','MCA (R)':'#ffa96f','PCA (R)':'#ffc1b0'},
  functional: {'M1 (Primary Motor)':'#9affc9','S1 (Primary Somatosensory)':'#b8ffc9',"Broca's area":'#e6ff99',"Wernicke's area":'#f8ffb3','V1 (Primary Visual)':'#c6ffd9','Auditory Cortex':'#b6f2ff'},
  lesions: {'L-MCA stroke':'#ff8aa0','R-MCA stroke':'#ffa0c8','L-ACA stroke':'#ffb67e','R-ACA stroke':'#ffd27e','PCA stroke (either)':'#a0b8ff','Lacunar (deep)':'#b3a3ff'}
};

/* ---- Content Registry (research-ish; concise, exam-friendly) ----
   Each entry has: overview[], clinical[], research[], fun[]
*/
const REGISTRY = {
  'ACA (L)': {
    overview: [
      'Supplies medial frontal/parietal cortex; callosomarginal & pericallosal branches.',
      'Somatotopy bias: leg>arm cortical representation along paracentral lobule.'
    ],
    clinical: [
      'Contralateral leg>arm weakness/sensory loss.',
      'Akinetic mutism/abulia with cingulate involvement.',
      'Urinary incontinence (frontal micturition center).'
    ],
    research: [
      'Perfusion MRI often shows anterior watershed vulnerability with hypotension.',
      'Callosal disconnection syndromes when pericallosal branches affected.'
    ],
    fun: [
      'The recurrent artery of Heubner (ACA branch) loves to show up on exams.',
      'Bilateral ACA infarcts can cause “magnetic gait”.'
    ]
  },
  'ACA (R)': {
    overview: [
      'Right ACA mirrors left in vascular territory; often subtler language impact.',
    ],
    clinical: [
      'Left leg-predominant weakness; disinhibition/personality change with medial frontal damage.',
    ],
    research: [
      'Right mesial frontal strokes linked to impaired sustained attention networks.'
    ],
    fun: [
      '“Callosomarginal” sounds like a punk band; it’s actually a key ACA branch.'
    ]
  },
  'MCA (L)': {
    overview: [
      'Largest cerebral artery; superior division → frontal/rostral insula, inferior division → posterior temporal/parietal.',
      'Deep perforators (lenticulostriates) feed internal capsule & basal ganglia.'
    ],
    clinical: [
      'Aphasia (Broca: nonfluent; Wernicke: fluent, paraphasic) if dominant hemisphere.',
      'Face/arm>leg weakness; gaze preference toward lesion acutely.',
      'Homonymous hemianopia from optic radiations.'
    ],
    research: [
      'Time-to-reperfusion strongly correlates with language recovery in L-MCA; collateral grade modifies penumbra.',
      'Clot perviousness on CTA predicts thrombectomy success.'
    ],
    fun: [
      '“Insular ribbon sign” on CT can be an early MCA infarct clue.'
    ]
  },
  'MCA (R)': {
    overview: [
      'Right lateral convexity and deep structures via lenticulostriates.',
    ],
    clinical: [
      'Hemispatial neglect, anosognosia, constructional apraxia.',
      'Left face/arm>leg weakness; left homonymous hemianopia.'
    ],
    research: [
      'Right temporoparietal junction is central for salience/attention reorienting.'
    ],
    fun: [
      'Patients may eat only the right side of their plate—classic neglect demo.'
    ]
  },
  'PCA (L)': {
    overview: [
      'Arises from basilar tip; calcarine & posterior temporal branches.',
      'Thalamoperforators can be PCA-derived → thalamic syndromes.'
    ],
    clinical: [
      'Right homonymous hemianopia; possible macular sparing.',
      'Alexia without agraphia (splenial + left occipital).'
    ],
    research: [
      'Visual cortex plasticity: perilesional reorganization detectable with fMRI.',
    ],
    fun: [
      'Patients may “not bump into things” if sparing is good despite field cut.'
    ]
  },
  'PCA (R)': {
    overview: [
      'Occipital and inferior temporal cortices on the right.',
    ],
    clinical: [
      'Left homonymous hemianopia; prosopagnosia if inferior occipitotemporal involved.'
    ],
    research: [
      'Right fusiform damage links to face identity processing deficits.'
    ],
    fun: [
      'Prosopagnosia is not “just forgetting names”—faces become unrecognizable.'
    ]
  },
  'M1 (Primary Motor)': {
    overview: [
      'Precentral gyrus; corticospinal origin with somatotopy (homunculus).',
      'Large Betz cells in layer V project to spinal motor neurons.'
    ],
    clinical: [
      'Contralateral UMN signs; fractionated finger weakness common.',
      'Seizure focus can cause Jacksonian march.'
    ],
    research: [
      'Motor maps show experience-dependent plasticity; rTMS can modulate excitability.',
    ],
    fun: [
      'Penfield’s “homunculus” drawings were based on intraoperative stimulation.'
    ]
  },
  'S1 (Primary Somatosensory)': {
    overview: [
      'Postcentral gyrus; modality-specific columns (touch, proprioception).'
    ],
    clinical: [
      'Cortical sensory loss: graphesthesia, stereognosis deficits.'
    ],
    research: [
      'Use-dependent expansion of cortical representations in musicians/athletes.'
    ],
    fun: [
      'Two-point discrimination thresholds vary dramatically across body sites.'
    ]
  },
  "Broca's area": {
    overview: [
      'Inferior frontal gyrus (opercularis/triangularis) in dominant hemisphere.',
      'Supports speech motor planning and syntactic processing.'
    ],
    clinical: [
      'Nonfluent/effortful speech; comprehension relatively preserved; impaired repetition.',
    ],
    research: [
      'White-matter coupling with premotor & basal ganglia circuits critical for fluency.'
    ],
    fun: [
      'Broca identified the region in 1861 correlating lesions with expressive aphasia.'
    ]
  },
  "Wernicke's area": {
    overview: [
      'Posterior superior temporal (dominant); lexical-semantic processing.',
    ],
    clinical: [
      'Fluent, paraphasic speech; impaired comprehension; neologisms; poor repetition.'
    ],
    research: [
      'Disconnection (arcuate fasciculus) can yield conduction aphasia—repetition disproportionately impaired.'
    ],
    fun: [
      'Patients may be unaware of deficits (anosognosia for language).'
    ]
  },
  'V1 (Primary Visual)': {
    overview: [
      'Calcarine cortex; precise retinotopy; dual-stream output to dorsal/ventral pathways.'
    ],
    clinical: [
      'Congruous field cuts; macular sparing via dual supply (MCA/PCA anastomoses) is possible.'
    ],
    research: [
      'Blind-sight phenomena: subcortical pathways mediating residual vision.'
    ],
    fun: [
      'Occipital cortex can “light up” with auditory stimuli in congenitally blind individuals.'
    ]
  },
  'Auditory Cortex': {
    overview: [
      'Heschl’s gyrus; tonotopic gradients; bilateral representation with slight contralateral bias.'
    ],
    clinical: [
      'Cortical deafness is rare; more commonly, word deafness or auditory agnosia.'
    ],
    research: [
      'Experience tunes cortical tuning curves; music training sharpens phase-locking.'
    ],
    fun: [
      'You literally have frequency maps in cortex—like a piano keyboard curled up.'
    ]
  },
  'L-MCA stroke': {
    overview: [
      'Ischemia in dominant lateral convexity/deep structures; embolic sources common.'
    ],
    clinical: [
      'Aphasia, right face/arm weakness, right homonymous hemianopia.',
      'Gaze preference toward lesion early.'
    ],
    research: [
      'Reperfusion within “golden hours” maximizes language recovery; collateral status predicts core growth.',
    ],
    fun: [
      '“Time is brain”: ~1.9 million neurons lost per minute in untreated stroke (modeled estimate).'
    ]
  },
  'R-MCA stroke': {
    overview: [
      'Non-dominant lateral convexity; neglect syndromes hallmark.'
    ],
    clinical: [
      'Left neglect, anosognosia, left homonymous hemianopia, left face/arm weakness.'
    ],
    research: [
      'Right temporoparietal damage alters salience network; prism adaptation can transiently reduce neglect.'
    ],
    fun: [
      'Patients may shave only the right side of their face—classic ward anecdote.'
    ]
  },
  'L-ACA stroke': {
    overview: ['Medial frontal/parietal ischemia in dominant hemisphere.'],
    clinical: ['Right leg>arm weakness; abulia/akinetic mutism; incontinence.'],
    research: ['Cingulo-frontal networks implicated in motivation/initiative deficits.'],
    fun: ['Bilateral ACA infarcts after A1 anomalies are a known pitfall.']
  },
  'R-ACA stroke': {
    overview: ['Medial frontal/parietal ischemia (non-dominant).'],
    clinical: ['Left leg>arm weakness; behavioral disinhibition.'],
    research: ['Right mesial frontal lesions: deficits in sustained attention vigilance.'],
    fun: ['“Alien leg” sensations described in rare case reports.']
  },
  'PCA stroke (either)': {
    overview: ['Posterior circulation cortical infarction.'],
    clinical: ['Contralateral homonymous hemianopia; visual agnosias possible.'],
    research: ['Perfusion–diffusion mismatch in occipital lobe predicts recovery of fields.'],
    fun: ['Reading can recover faster than visual search—different pathways.']
  },
  'Lacunar (deep)': {
    overview: [
      'Small vessel lipohyalinosis of perforators → internal capsule/thalamus/pons.'
    ],
    clinical: [
      'Pure motor, pure sensory, ataxic hemiparesis, dysarthria–clumsy hand syndromes.'
    ],
    research: [
      'Blood–brain barrier leakage & perivascular spaces correlate with small vessel disease burden.'
    ],
    fun: [
      'Despite tiny size, capsular lacunes can produce dense hemiparesis—location beats volume.'
    ]
  }
};

/* ---- Brain geometry ---- */
const brainMask = new Set();
function addEllipse(cx, cy, rx, ry, targetSet=brainMask) {
  for (let y = Math.max(0, cy - ry); y <= Math.min(GRID_H - 1, cy + ry); y++) {
    for (let x = Math.max(0, cx - rx); x <= Math.min(GRID_W - 1, cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx*dx + dy*dy <= 1) targetSet.add(`${x},${y}`);
    }
  }
}
(function buildBrain() {
  const mid = Math.floor(GRID_W/2);
  addEllipse(mid - 10, 18, 16, 12);
  addEllipse(mid + 10, 18, 16, 12);
  addEllipse(mid, 30, 14, 7);
  addEllipse(mid - 3, 16, 5, 7);
  addEllipse(mid + 3, 16, 5, 7);
})();
const maps = { arterial:new Map(), functional:new Map(), lesions:new Map() };
function hemiOf(x){ return x < Math.floor(GRID_W/2) ? 'L' : (x > Math.floor(GRID_W/2) ? 'R' : 'mid'); }

/* Arterial */
(function buildArterial(){
  for (const key of brainMask) {
    const [x,y] = key.split(',').map(Number);
    const hemi = hemiOf(x);
    if (hemi==='mid') continue;
    const isLeft = (hemi==='L');
    const hemiX0 = isLeft ? 0 : Math.floor(GRID_W/2);
    const hemiW = Math.floor(GRID_W/2);
    const relX = (x - hemiX0)/hemiW, relY = y/GRID_H;
    const posterior = relX > 0.66 && relY > 0.48;
    const superior  = relY < 0.33;
    const label = superior ? `ACA (${hemi})` : (posterior ? `PCA (${hemi})` : `MCA (${hemi})`);
    maps.arterial.set(key, label);
  }
})();

/* Functional */
(function buildFunctional(){
  for (const key of brainMask) {
    const [x,y] = key.split(',').map(Number);
    const band = Math.abs(x - Math.floor(GRID_W/2)) <= 5 && (y>=12 && y<=26);
    if (band) (x < Math.floor(GRID_W/2)) ? maps.functional.set(key,'M1 (Primary Motor)') : maps.functional.set(key,'S1 (Primary Somatosensory)');
    if (x >= Math.floor(GRID_W*0.7) && y>=12 && y<=26) maps.functional.set(key,'V1 (Primary Visual)');
    if (y >= 18 && y <= 22 && x >= Math.floor(GRID_W*0.38) && x <= Math.floor(GRID_W*0.62)) maps.functional.set(key,'Auditory Cortex');
  }
  maps.functional.repaintLanguage = function(dom){
    for (const [key,label] of [...maps.functional.entries()]) {
      if (label==="Broca's area" || label==="Wernicke's area") maps.functional.delete(key);
    }
    for (const key of brainMask) {
      const [x,y] = key.split(',').map(Number);
      if (dom==='L') {
        if (x>=12 && x<=20 && y>=22 && y<=28) maps.functional.set(key,"Broca's area");
        if (x>=18 && x<=24 && y>=18 && y<=22) maps.functional.set(key,"Wernicke's area");
      } else {
        if (x>=GRID_W-20 && x<=GRID_W-12 && y>=22 && y<=28) maps.functional.set(key,"Broca's area");
        if (x>=GRID_W-24 && x<=GRID_W-18 && y>=18 && y<=22) maps.functional.set(key,"Wernicke's area");
      }
    }
  };
  maps.functional.repaintLanguage('L');
})();

/* Lesions */
(function buildLesions(){
  for (const key of brainMask) {
    const [x,y] = key.split(',').map(Number);
    const hemi = hemiOf(x);
    if (hemi==='L' && y>=12 && y<=28 && x>=10 && x<=Math.floor(GRID_W/2)-4) maps.lesions.set(key,'L-MCA stroke');
    if (hemi==='R' && y>=12 && y<=28 && x<=GRID_W-10 && x>=Math.floor(GRID_W/2)+4) maps.lesions.set(key,'R-MCA stroke');
    if (hemi==='L' && y<=16 && x<=Math.floor(GRID_W*0.28)) maps.lesions.set(key,'L-ACA stroke');
    if (hemi==='R' && y<=16 && x>=Math.floor(GRID_W*0.72)) maps.lesions.set(key,'R-ACA stroke');
    if (y>=14 && x>=Math.floor(GRID_W*0.68)) maps.lesions.set(key,'PCA stroke (either)');
    if (Math.abs(x - Math.floor(GRID_W/2)) <= 3 && y>=18 && y<=26) maps.lesions.set(key,'Lacunar (deep)');
  }
})();

/* ---- Render ---- */
function clear(){ ctx.clearRect(0,0,CANVAS_W,CANVAS_H); }
function drawGrid(){
  if (!showGrid) return;
  ctx.save(); ctx.globalAlpha=.12; ctx.strokeStyle='#4a4e66';
  for (let x=0;x<=CANVAS_W;x+=TILE){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CANVAS_H); ctx.stroke(); }
  for (let y=0;y<=CANVAS_H;y+=TILE){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CANVAS_W,y); ctx.stroke(); }
  ctx.restore();
}
function drawBrainBase(){
  for (const key of brainMask) {
    const [x,y] = key.split(',').map(Number);
    ctx.fillStyle='#1b2033'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    ctx.fillStyle='#1f2740'; ctx.fillRect(x*TILE,y*TILE,TILE,Math.floor(TILE*.22));
  }
}
function drawOverlay(activeMap,palette,hoverKey,pinnedKey){
  for (const [key,label] of activeMap.entries()){
    if (typeof label!=='string') continue;
    const [x,y] = key.split(',').map(Number);
    ctx.fillStyle = palette[label] || '#7a8cff';
    ctx.globalAlpha=.68; ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    if (key===hoverKey || key===pinnedKey){ ctx.globalAlpha=1; ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(x*TILE+1,y*TILE+1,TILE-2,TILE-2); }
  }
  ctx.globalAlpha=1;
}
function render(h=null,p=null){
  clear(); drawBrainBase(); drawOverlay(maps[mode], PALETTES[mode], h, p); drawGrid();
}
function updateLegend(){
  legendEl.innerHTML='';
  Object.entries(PALETTES[mode]).forEach(([name,color])=>{
    const chip=document.createElement('div'); chip.className='chip';
    chip.innerHTML=`<span class="swatch" style="background:${color}"></span>${name}`;
    legendEl.appendChild(chip);
  });
}

/* ---- Interaction ---- */
function cellFromEvent(ev){
  const rect = canvas.getBoundingClientRect();
  const sx = CANVAS_W / rect.width, sy = CANVAS_H / rect.height;
  const x = Math.floor((ev.clientX - rect.left) * sx / TILE);
  const y = Math.floor((ev.clientY - rect.top) * sy / TILE);
  return `${x},${y}`;
}
function labelFor(key){ return maps[mode].get(key) ?? null; }
function clampTooltip(el, container){
  const c = container.getBoundingClientRect(), t = el.getBoundingClientRect();
  let dx=0,dy=0; if (t.right>c.right) dx=c.right-t.right-8; if (t.bottom>c.bottom) dy=c.bottom-t.bottom-8;
  el.style.transform = `translate(${12+dx}px, ${-8+dy}px)`;
}

canvas.addEventListener('mousemove', (e)=>{
  const key = cellFromEvent(e);
  hoverKey = brainMask.has(key) ? key : null;
  const label = hoverKey ? labelFor(hoverKey) : null;
  if (label){
    tooltip.textContent = label; tooltip.hidden=false;
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top  = (e.clientY - rect.top)  + 'px';
    clampTooltip(tooltip, canvas.parentElement);
  } else { tooltip.hidden=true; }
  render(hoverKey, pinnedKey);
});

canvas.addEventListener('mouseleave', ()=>{ hoverKey=null; tooltip.hidden=true; render(hoverKey,pinnedKey); });

canvas.addEventListener('click', (e)=>{
  const key = cellFromEvent(e);
  if (!brainMask.has(key)) return;
  const label = labelFor(key);
  if (!label) return;
  pinnedKey = key; render(hoverKey, pinnedKey);
  populatePanes(label);
});

/* Tabs */
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tabs.forEach(b=>{ b.classList.toggle('active', b===btn); b.setAttribute('aria-selected', b===btn?'true':'false'); });
    const paneId = 'pane-' + btn.dataset.pane;
    Object.values(panes).forEach(p=>p.classList.remove('active'));
    document.getElementById(paneId).classList.add('active');
  });
});

/* Controls */
document.querySelectorAll('.mode-btn').forEach((btn, idx)=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-btn').forEach(b=>{ b.classList.toggle('active', b===btn); b.setAttribute('aria-selected', b===btn?'true':'false'); });
    mode = btn.dataset.mode; pinnedKey=null; hoverKey=null; tooltip.hidden=true;
    updateLegend(); clearPanes(); render();
  });
});
gridToggle.addEventListener('change', e=>{ showGrid = e.target.checked; render(hoverKey,pinnedKey); });
dominanceSel.addEventListener('change', e=>{ dominance = e.target.value; if (typeof maps.functional.repaintLanguage==='function'){ maps.functional.repaintLanguage(dominance); if (mode==='functional') render(hoverKey,pinnedKey); } });
resetBtn.addEventListener('click', ()=>{ pinnedKey=null; hoverKey=null; tooltip.hidden=true; render(); clearPanes(true); });

window.addEventListener('keydown', (e)=>{
  const k=e.key.toLowerCase();
  if (k==='l'){ showGrid=!showGrid; gridToggle.checked=showGrid; render(hoverKey,pinnedKey); }
  if (k==='r'){ resetBtn.click(); }
  if (k==='s'){ toggleStudy(); }
  if (k==='1'||k==='2'||k==='3'){ const m=(k==='1')?'arterial':(k==='2')?'functional':'lesions'; document.querySelector(`.mode-btn[data-mode="${m}"]`)?.click(); }
});
window.addEventListener('resize', ()=>render(hoverKey,pinnedKey));

/* ---- Pane population ---- */
function clearPanes(initial=false){
  const msg = initial ? '<p>Hover and click a region to pin details here.</p>' : `<p>Mode: <strong>${mode}</strong>. Click a region to load details.</p>`;
  panes.overview.innerHTML = msg;
  panes.clinical.innerHTML = '<p>—</p>';
  panes.research.innerHTML = '<p>—</p>';
  panes.fun.innerHTML = '<p>—</p>';
}
function listify(arr){ return '<ul>'+arr.map(x=>`<li>${x}</li>`).join('')+'</ul>'; }
function populatePanes(label){
  const entry = REGISTRY[label] || null;
  const title = `<h3>${label}</h3>`;
  if (!entry){ clearPanes(); panes.overview.innerHTML = title + '<p>No details yet.</p>'; return; }
  panes.overview.innerHTML = title + listify(entry.overview);
  panes.clinical.innerHTML = listify(entry.clinical);
  panes.research.innerHTML = listify(entry.research);
  panes.fun.innerHTML = listify(entry.fun);
}

/* ---- Study Mode (flashcard + quiz) ---- */
let quizTimer = null, remaining = 60;
function toggleStudy(){
  if (modal.hasAttribute('hidden')) openStudy(); else closeStudy();
}
studyBtn.addEventListener('click', toggleStudy);
modalClose.addEventListener('click', closeStudy);
function openStudy(){
  modal.removeAttribute('hidden'); modal.setAttribute('aria-hidden','false');
  buildFlashcard(); buildQuiz(); startTimer();
}
function closeStudy(){
  modal.setAttribute('hidden',''); modal.setAttribute('aria-hidden','true');
  stopTimer(); quizFeedback.textContent=''; cardBack.hidden=true;
}
function startTimer(){ remaining = 60; timerEl.textContent = `(${remaining}s)`; quizTimer = setInterval(()=>{ remaining--; timerEl.textContent=`(${remaining}s)`; if (remaining<=0){ clearInterval(quizTimer); quizTimer=null; quizFeedback.textContent='⏰ Time! Try another round.'; }}, 1000); }
function stopTimer(){ if (quizTimer){ clearInterval(quizTimer); quizTimer=null; } timerEl.textContent=''; }

function currentLabel(){
  if (!pinnedKey) return null;
  const label = maps[mode].get(pinnedKey);
  return (typeof label==='string') ? label : null;
}
function buildFlashcard(){
  const label = currentLabel() || 'M1 (Primary Motor)';
  const entry = REGISTRY[label];
  cardFront.innerHTML = `<strong>${label}</strong><br><em>Prompt:</em> Name two hallmark features.`;
  cardBack.innerHTML  = entry ? listify([...(entry.clinical.slice(0,2))]) : '<p>—</p>';
  cardBack.hidden = true;
}
revealBtn.addEventListener('click', ()=>{ cardBack.hidden = !cardBack.hidden; });

/* Quiz: generate MCQ with stem from registry and answer choices from mixed entries */
let quizPool = [];
function buildQuiz(){
  quizPool = generateQuestions(6);
  serveQuestion();
}
function generateQuestions(n=5){
  const keys = Object.keys(REGISTRY);
  const items = [];
  for (let i=0;i<n;i++){
    const correctKey = keys[Math.floor(Math.random()*keys.length)];
    const incorrect = [];
    while (incorrect.length<3){
      const k = keys[Math.floor(Math.random()*keys.length)];
      if (k!==correctKey && !incorrect.includes(k)) incorrect.push(k);
    }
    const stem = makeStem(correctKey);
    items.push({stem, correct: correctKey, choices: shuffle([correctKey, ...incorrect])});
  }
  return items;
}
function makeStem(key){
  const e = REGISTRY[key];
  if (!e) return `Which label best matches this description?`;
  // Prefer clinical lines for stems
  const pool = [...e.clinical, ...(e.overview.slice(0,1))];
  const text = pool[Math.floor(Math.random()*pool.length)];
  return `Which region/territory best matches: “${text}”`;
}
function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }

let qIndex = 0;
function serveQuestion(){
  if (!quizPool.length){ buildQuiz(); }
  const q = quizPool[qIndex % quizPool.length];
  quizQ.textContent = q.stem;
  quizChoices.innerHTML = '';
  quizFeedback.textContent='';
  q.choices.forEach(choice=>{
    const btn = document.createElement('button');
    btn.className='ghost small';
    btn.textContent = choice;
    btn.addEventListener('click', ()=>{
      if (choice===q.correct){ quizFeedback.textContent='✅ Correct'; }
      else { quizFeedback.textContent=`❌ Incorrect — answer: ${q.correct}`; }
    });
    quizChoices.appendChild(btn);
  });
}
nextQBtn.addEventListener('click', ()=>{ qIndex++; serveQuestion(); });
restartQBtn.addEventListener('click', ()=>{ buildQuiz(); qIndex=0; remaining=60; });

/* ---- Init ---- */
function init(){
  updateLegend(); clearPanes(true); render();
}
init();