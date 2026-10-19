// Chaque entier désigne le rang d'une carte dans le paquet initial.
// 0 = 8 trèfle, 7 = as trèfle, 8 = 8 cœur, etc.
const suits = ['♣', '♥', '♠', '♦'];
const values = ['8', '7', '6', '5', '4', '3', '2', 'A'];
const colors = ['#427bdb', '#be4b85', '#3e9d73', '#b98229', '#8059c0', '#258d99', '#c15a35',
  '#737e38'
];
const labels = ['Préparer', 'Riffle 1', 'Riffle 2', 'Couper', 'Mémoriser', 'Réinsérer',
  'Couper encore', 'Observer'
];
// État de la partie. generation invalide une animation après réinitialisation.
let deck = [];
let step = 0;
let selected = null;
let busy = false;
let generation = 0;
const $ = id => document.getElementById(id);

// Synchronise les deux emplacements du message de résultat.
function setStatus(message) {
  $('statusTop').textContent = message;
  $('status').textContent = message;
}

function cardName(id) {
  return values[id % 8] + suits[Math.floor(id / 8)];
}

function isRedCard(id) {
  return [1, 3].includes(Math.floor(id / 8));
}

function createCard(id, mini = false) {
  const el = document.createElement('div');
  el.className = (mini ? 'mini' : 'card') + (isRedCard(id) ? ' red' : '');
  el.setAttribute('aria-label', cardName(id));
  if (mini) {
    el.textContent = cardName(id);
  } else {
    el.innerHTML = `
      <span class="corner">${cardName(id)}</span>
      <span class="suit">${suits[Math.floor(id / 8)]}</span>
      <span class="corner bottom">${cardName(id)}</span>
      <span class="rank">rang ${id}</span>
    `;
  }
  return el;
}

function addControlButton(text, action, secondary = false) {
  const b = document.createElement('button');
  b.textContent = text;
  b.className = secondary ? 'secondary' : '';
  b.onclick = action;
  $('controls').append(b);
  return b;
}

// Affiche le paquet et, à l’étape de réinsertion, les emplacements disponibles.
function renderDeck() {
  $('deck').replaceChildren();
  deck.forEach((id, i) => {
    const cell = document.createElement('div');
    if (step === 5) {
      cell.className = 'insert-cell';
      const b = document.createElement('button');
      b.className = 'slot';
      b.textContent = '↓ Remettre ici';
      b.setAttribute('aria-label', 'Remettre avant ' + cardName(id));
      b.onclick = () => insertSelectedCard(i);
      cell.append(b);
    }
    const c = createCard(id);
    if (i === 0) c.classList.add('top');
    cell.append(c);
    $('deck').append(cell);
  });
  if (step === 5) {
    const b = document.createElement('button');
    b.className = 'slot';
    b.textContent = 'Remettre à la fin';
    b.onclick = () => insertSelectedCard(deck.length);
    $('deck').append(b);
  }
}

// Reconstruit les contrôles correspondant à l’étape courante.
function renderStep() {
  $('steps').innerHTML = labels.map((l, i) => '<span class="' + (i === step ? 'active' : '') +
    '">' + (i + 1) + '. ' + l + '</span>').join('');
  $('stage').textContent = 'ÉTAPE ' + (step + 1) + ' / 8';
  $('title').textContent = labels[step];
  $('controls').replaceChildren();
  $('held').replaceChildren();
  setStatus('');
  $('shuffle').hidden = true;
  const instructions = [
    'Voici le paquet préparé : 8 à as, trèfles puis cœurs, piques et carreaux. Le petit numéro est son rang de référence.',
    'Cliquez pour séparer le paquet et voir les cartes des deux moitiés s’entrelacer lentement.',
    'Un deuxième riffle entrelace de nouveau deux moitiés du paquet obtenu.',
    'Choisissez une frontière avec le curseur. Les cartes avant cette frontière passent sous le paquet, sans changer leur ordre.',
    'Le tour du rapport demande de prendre la carte du dessus, encadrée en doré. Vous ne choisissez donc pas une carte quelconque.',
    'La carte mémorisée est sortie du jeu. Cliquez sur « Remettre ici » à l’endroit choisi, de préférence au milieu du paquet.',
    'Vous pouvez encore couper : cela fait tourner le paquet, sans mélanger les cartes.',
    'Observez les séquences et la position réelle de votre carte. Lancez la recherche automatique ; elle peut afficher plusieurs candidats.'
  ];
  $('instruction').textContent = instructions[step];
  renderDeck();
  if (step === 0) addControlButton('Commencer le tour', () => {
    step++;
    renderStep();
  });
  if (step === 1 || step === 2) addControlButton('Animer le riffle ' + step, shuffle);
  if (step === 3 || step === 6) renderCutControls();
  if (step === 4) addControlButton('Prendre et voir la carte du dessus', () => {
    selected = deck.shift();
    step = 5;
    renderStep();
  });
  if (step === 5) {
    $('held').append(createCard(selected));
    const p = document.createElement('p');
    p.textContent = 'Votre carte : ' + cardName(selected) +
      '. Choisissez maintenant où la remettre.';
    $('held').append(p);
  }
  if (step === 7) {
    addControlButton('Rechercher automatiquement', searchCard);
    addControlButton('Colorer les séquences', sequences);
    addControlButton('Vérifier ma carte', () => {
      [...$('deck').children].forEach((cell, i) => cell.querySelector('.card').classList.toggle(
        'marked', deck[i] === selected));
      setStatus('La carte mémorisée est ' + cardName(selected) + ' ; position ' + (deck.indexOf(
        selected) + 1) + '. C’est une vérification, pas une déduction.');
    }, true);
  }
}

function renderCutControls() {
  const label = document.createElement('label');
  label.textContent = 'Couper après ';
  const range = document.createElement('input');
  range.type = 'range';
  range.min = 1;
  range.max = 31;
  range.value = 16;
  range.setAttribute('aria-label', 'Nombre de cartes déplacées sous le paquet');
  const output = document.createElement('output');
  label.append(range, output);
  $('controls').append(label);

  function preview() {
    output.textContent = range.value + ' cartes';
    [...$('deck').children].forEach((cell, i) => {
      cell.querySelector('.card').style.transform = i < Number(range.value) ?
        'translateY(-8px)' : '';
    });
    setStatus('Frontière entre ' + cardName(deck[range.value - 1]) + ' et ' + cardName(deck[range
      .value]) + '. Les ' + range.value + ' premières cartes passeront dessous.');
  }
  range.oninput = preview;
  preview();
  addControlButton('Effectuer la coupe', () => {
    const k = Number(range.value);
    deck = [...deck.slice(k), ...deck.slice(0, k)];
    step++;
    renderStep();
    setStatus("Coupe terminée : " + k +
      " cartes sont passées sous le paquet, sans modifier leur ordre interne.");
  });
  addControlButton('Continuer sans couper', () => {
    step++;
    renderStep();
  }, true);
}

function insertSelectedCard(position) {
  deck.splice(position, 0, selected);
  step = 6;
  renderStep();
  setStatus("Carte remise en position " + (position + 1) +
    ". Vous pouvez maintenant couper à nouveau ou continuer.");
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// Entrelace les moitiés en préservant leur ordre interne.
async function shuffle() {
  if (busy) return;
  busy = true;
  const token = generation;
  [...$('controls').querySelectorAll('button')].forEach(b => b.disabled = true);
  $('shuffle').hidden = false;
  // Coupe proche du milieu. Le tirage pondéré entrelace sans réordonner.
  const split = 12 + Math.floor(Math.random() * 9);
  const a = deck.slice(0, split),
    b = deck.slice(split),
    result = [];
  $('left').replaceChildren(...a.map(x => createCard(x, true)));
  $('right').replaceChildren(...b.map(x => createCard(x, true)));
  $('merged').replaceChildren();
  setStatus('Regardez : seule la prochaine carte de chaque moitié peut être ajoutée.');
  while (a.length || b.length) {
    await wait(160);
    // Une nouvelle partie a commencé pendant l’attente : abandonner l’animation.
    if (token !== generation) {
      return;
    }
    const fromA = !b.length || (a.length && Math.random() < a.length / (a.length + b.length));
    const source = fromA ? a : b,
      id = source.shift();
    result.push(id);
    $(fromA ? 'left' : 'right').firstElementChild.remove();
    const c = createCard(id, true);
    c.classList.add('enter');
    $('merged').append(c);
  }
  deck = result;
  renderDeck();
  busy = false;
  setStatus('Mélange terminé. L’ordre interne de chaque moitié a été conservé.');
  $('controls').replaceChildren();
  addControlButton('Continuer', () => {
    step++;
    renderStep();
  });
}

function highlightSequences() {
  // Définition linéaire : les rangs consécutifs restent une même
  // séquence tant que leurs positions dans le paquet augmentent.
  const pos = [];
  deck.forEach((id, i) => pos[id] = i);
  const groups = [];
  let group = 0;
  groups[0] = 0;
  for (let id = 1; id < 32; id++) {
    if (pos[id] < pos[id - 1]) group++;
    groups[id] = group;
  }
  [...$('deck').children].forEach((cell, i) => {
    const c = cell.querySelector('.card');
    c.classList.add('sequence');
    c.style.borderTopColor = colors[groups[deck[i]] % colors.length];
  });
  setStatus((group + 1) +
    ' séquences dans cette lecture linéaire. Les cartes d’une même séquence ont la même couleur. Après une coupe, cette lecture peut scinder une séquence circulaire : ce nombre ne suffit pas à retrouver la carte.'
    );
}
// Recherche indépendante : uniquement le paquet final, jamais selected.
// Critère conservateur : annuler un déplacement puis tester toutes les coupes.
function risingCount(order) {
  const pos = [];
  order.forEach((id, i) => pos[id] = i);
  let count = 1;
  for (let id = 1; id < order.length; id++)
    if (pos[id] < pos[id - 1]) count++;
  return count;
}

// Test nécessaire, mais conservateur : les tailles des moitiés ne sont pas vérifiées.
function compatibleWithTwoRiffles(order) {
  for (let cut = 0; cut < order.length; cut++) {
    const rotated = order.slice(cut).concat(order.slice(0, cut));
    if (risingCount(rotated) <= 4) return true;
  }
  return false;
}

// Aucun accès à selected : l’analyse utilise seulement l’ordre final des cartes.
function findCandidates(finalDeck) {
  const result = [];
  for (const candidate of finalDeck) {
    const rest = finalDeck.filter(id => id !== candidate);
    for (let gap = 0; gap < rest.length; gap++) {
      const restored = rest.slice();
      restored.splice(gap, 0, candidate);
      if (compatibleWithTwoRiffles(restored)) {
        result.push(candidate);
        break;
      }
    }
  }
  return result;
}

function searchCard() {
  const candidates = findCandidates(deck.slice());
  [...$('deck').children].forEach((cell, i) => cell.querySelector('.card').classList.toggle(
    'marked', candidates.includes(deck[i])));
  if (candidates.length === 1) setStatus('Carte retrouvée : ' + cardName(candidates[0]) +
    '. Une seule carte explique le déplacement selon le critère des séquences.');
  else if (candidates.length) setStatus('Résultat ambigu : ' + candidates.length +
    ' cartes possibles — ' + candidates.map(name).join(', ') +
    '. Elles sont encadrées en bleu. Le critère des séquences ne permet pas de choisir une seule carte.'
    );
  else setStatus('Aucune carte compatible avec les règles analysées.');
}

function reset() {
  generation++;
  busy = false;
  deck = Array.from({
    length: 32
  }, (_, i) => i);
  step = 0;
  selected = null;
  renderStep();
}
$('reset').onclick = reset;
reset();