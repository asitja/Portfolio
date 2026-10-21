const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(`${__dirname}/../script.js`, 'utf8');
const ids = ['steps', 'stage', 'title', 'controls', 'held', 'statusTop', 'status',
  'shuffle', 'deck', 'instruction', 'left', 'right', 'merged', 'reset'];

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.className = '';
    this.style = {};
    this.attributes = {};
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this._text = '';
    this._html = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => {
        this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean),
          ...names])].join(' ');
      },
      remove: (...names) => {
        this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' ');
      },
      toggle: (name, force) => {
        const enabled = force === undefined ? !this.classList.contains(name) : Boolean(force);
        this.classList[enabled ? 'add' : 'remove'](name);
        return enabled;
      }
    };
  }

  get firstElementChild() { return this.children[0] || null; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) {
    this.replaceChildren();
    this._text = String(value);
  }
  get innerHTML() { return this._html; }
  set innerHTML(value) {
    this.replaceChildren();
    this._html = String(value);
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...children) {
    for (const child of children) {
      child.remove();
      child.parentElement = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this._text = '';
    this._html = '';
    this.append(...children);
  }
  remove() {
    if (!this.parentElement) return;
    const siblings = this.parentElement.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parentElement = null;
  }
  querySelectorAll(selector) {
    assert.match(selector, /^(?:\.[\w-]+|[a-z]+)$/i, 'Unsupported fake DOM selector');
    const matches = [];
    for (const child of this.children) {
      if (selector.startsWith('.') ? child.classList.contains(selector.slice(1)) :
        child.tagName === selector.toUpperCase()) matches.push(child);
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function load({ reducedMotion = false, seed = 12345 } = {}) {
  const elements = Object.fromEntries(ids.map(id => [id, new Element(id === 'reset' ? 'button' : 'div')]));
  const timers = new Map();
  const delays = [];
  const mediaQueries = [];
  let nextTimer = 0;
  const math = Object.create(Math);
  math.random = randomGenerator(seed);
  const context = vm.createContext({
    document: {
      getElementById(id) {
        assert.ok(elements[id], `Unknown element: ${id}`);
        return elements[id];
      },
      createElement: tagName => new Element(tagName)
    },
    window: {
      matchMedia(query) {
        mediaQueries.push(query);
        return { matches: reducedMotion };
      }
    },
    Math: math,
    setTimeout(callback, delay) {
      delays.push(delay);
      timers.set(++nextTimer, callback);
      return nextTimer;
    },
    clearTimeout: timer => timers.delete(timer)
  });
  const run = code => vm.runInContext(code, context, { timeout: 10000 });
  vm.runInContext(source, context, { filename: 'script.js', timeout: 10000 });
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  const invoke = (element, event = 'onclick') => {
    assert.ok(element, 'Missing UI element');
    assert.equal(element.disabled, false, 'Cannot click a disabled control');
    context.eventTarget = element;
    try { return run(`eventTarget.${event}()`); }
    finally { delete context.eventTarget; }
  };
  const button = text => {
    const found = elements.controls.querySelectorAll('button').find(control => control.textContent === text);
    assert.ok(found, `Missing control: ${text}`);
    return found;
  };
  const tick = async () => {
    assert.ok(timers.size, 'Expected an animation timeout');
    const [timer, callback] = timers.entries().next().value;
    timers.delete(timer);
    callback();
    await Promise.resolve();
  };
  const drain = async () => {
    for (let count = 0; timers.size; count++) {
      assert.ok(count < 200, 'Animation did not terminate');
      await tick();
    }
  };
  return { run, json, elements, timers, delays, mediaQueries, invoke, button, tick, drain };
}

const ordered = length => Array.from({ length }, (_, index) => index);
const rotate = (order, cut) => [...order.slice(cut), ...order.slice(0, cut)];

function referenceRising(order) {
  if (!order.length) return 0;
  const positions = new Map(order.map((id, index) => [id, index]));
  return 1 + ordered(order.length - 1).filter(id => positions.get(id + 1) < positions.get(id)).length;
}

function referenceCompatible(order) {
  return !order.length || order.some((_, cut) => referenceRising(rotate(order, cut)) <= 4);
}

function referenceCandidates(order) {
  return order.filter(candidate => {
    const rest = order.filter(id => id !== candidate);
    for (let gap = 0; gap < rest.length; gap++) {
      const restored = rest.slice();
      restored.splice(gap, 0, candidate);
      if (referenceCompatible(restored)) return true;
    }
    return false;
  });
}

function permutation(length, random) {
  const result = ordered(length);
  for (let index = length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function riffle(order, random) {
  const split = 12 + Math.floor(random() * 9);
  const left = order.slice(0, split);
  const right = order.slice(split);
  const result = [];
  while (left.length || right.length) {
    const takeLeft = !right.length || (left.length && random() < left.length / (left.length + right.length));
    result.push((takeLeft ? left : right).shift());
  }
  return result;
}

function history(seed, samePlace = false) {
  const random = randomGenerator(seed);
  const shuffled = riffle(riffle(ordered(32), random), random);
  const cutDeck = rotate(shuffled, 1 + Math.floor(random() * 31));
  const selected = cutDeck[0];
  const reinserted = cutDeck.slice(1);
  reinserted.splice(samePlace ? 0 : 1 + Math.floor(random() * 30), 0, selected);
  return { selected, before: cutDeck, final: rotate(reinserted, Math.floor(random() * 32)) };
}

function assertStatus(app, expected) {
  assert.equal(app.elements.statusTop.textContent, app.elements.status.textContent);
  assert.match(app.elements.status.textContent, expected);
}

test('initialisation: script entier, rendu des 32 cartes et bouton reset', () => {
  const app = load();
  assert.deepEqual(app.json('deck'), ordered(32));
  assert.deepEqual(app.json('({ step, selected, busy, generation })'),
    { step: 0, selected: null, busy: false, generation: 1 });
  assert.equal(app.elements.deck.children.length, 32);
  assert.equal(app.elements.deck.querySelectorAll('.cut-end').length, 0);
  assert.equal(app.elements.deck.querySelectorAll('.red').length, 16);
  assert.equal(app.elements.deck.querySelector('.card').getAttribute('aria-label'), app.run('cardName(0)'));
  assert.match(app.elements.steps.innerHTML, /active/);
  assert.equal(app.elements.shuffle.hidden, true);
  app.invoke(app.button('Commencer le tour'));
  assert.equal(app.run('step'), 1);
  app.invoke(app.elements.reset);
  assert.equal(app.run('step'), 0);
});

test('risingCount: cas limites et definition de reference', () => {
  const app = load();
  const random = randomGenerator(71);
  for (const length of [0, 1, 2, 5, 16, 32]) {
    for (const order of [ordered(length), ordered(length).reverse(), permutation(length, random)]) {
      assert.equal(app.run(`risingCount(${JSON.stringify(order)})`), referenceRising(order));
    }
  }
});

test('compatibleWithTwoRiffles optimise = rotations + risingCount sur permutations deterministes', () => {
  const app = load();
  const random = randomGenerator(20261021);
  let accepted = 0;
  let rejected = 0;
  for (const length of [0, 1, 2, 4, 5, 8, 16, 32]) {
    const samples = [ordered(length), ordered(length).reverse(),
      ...ordered(32).map(() => permutation(length, random))];
    for (const order of samples) {
      const expected = referenceCompatible(order);
      assert.equal(app.run(`compatibleWithTwoRiffles(${JSON.stringify(order)})`), expected,
        `order=${JSON.stringify(order)}`);
      if (expected) accepted++; else rejected++;
    }
  }
  assert.ok(accepted > 0 && rejected > 0);
});

test('findCandidates = reference independante, sans mutation (echantillon borne)', () => {
  const app = load();
  const random = randomGenerator(428);
  const samples = [[], [0], ordered(8), ordered(16).reverse(),
    ...ordered(4).map(() => permutation(10, random)),
    ...ordered(3).map(() => permutation(32, random)),
    ...[11, 29, 47].map(seed => history(seed).final)];
  for (const order of samples) {
    const snapshot = order.slice();
    app.run(`globalThis.inputDeck = Object.freeze(${JSON.stringify(order)})`);
    assert.deepEqual(app.json('findCandidates(inputDeck)'), referenceCandidates(order),
      `order=${JSON.stringify(order)}`);
    assert.deepEqual(app.json('inputDeck'), snapshot);
    assert.deepEqual(order, snapshot);
  }
});

test('carte reellement deplacee reste candidate apres deux riffles et deux coupes', () => {
  const app = load();
  for (const seed of [1, 7, 11, 29, 47, 103, 991, 2026]) {
    const fixture = history(seed);
    assert.equal(referenceCompatible(fixture.before), true);
    assert.ok(app.json(`findCandidates(${JSON.stringify(fixture.final)})`).includes(fixture.selected),
      `seed=${seed}, selected=${fixture.selected}`);
  }
});

test('analyzeDeck reel: remise au meme endroit, aucune rupture, recherche court-circuitee', () => {
  const app = load();
  const fixture = history(29, true);
  app.run('findCandidates = () => { throw new Error("Unexpected candidate search"); }');
  const result = app.json(`analyzeDeck(${JSON.stringify(fixture.final)})`);
  assert.deepEqual(result.candidates, []);
  assert.match(result.message, /aucune rupture/i);
  assert.match(result.message, /m.me endroit/i);
  assert.doesNotMatch(result.message, /Aucune carte compatible trouv/);
});

test('analyzeDeck simule: branche une seule candidate', () => {
  const app = load();
  app.run('compatibleWithTwoRiffles = () => false; findCandidates = () => [12]');
  const result = app.json('analyzeDeck(deck)');
  assert.deepEqual(result.candidates, [12]);
  assert.match(result.message, /Une seule carte candidate/);
  assert.ok(result.message.includes(app.run('cardName(12)')));
  assert.match(result.message, /bleu/);
});

test('analyzeDeck simule: deux candidates, exemple 123546 et deplacement du 4 ou du 5', () => {
  const app = load();
  app.run('compatibleWithTwoRiffles = () => false; findCandidates = () => [4, 5]');
  const result = app.json('analyzeDeck(deck)');
  assert.deepEqual(result.candidates, [4, 5]);
  assert.match(result.message, /Deux cartes possibles/);
  assert.match(result.message, /123456.*123546/);
  assert.match(result.message, /du 4 ou du 5/);
  for (const candidate of result.candidates) assert.ok(result.message.includes(app.run(`cardName(${candidate})`)));
});

test('analyzeDeck reel: candidate unique sur quatre sequences avec deplacement', () => {
  const app = load();
  const fixture = ordered(8).flatMap(index => [index, index + 8, index + 16, index + 24]);
  fixture.splice(fixture.indexOf(4), 1);
  fixture.splice(25, 0, 4);
  assert.equal(referenceCompatible(fixture), false);
  const expected = referenceCandidates(fixture);
  assert.deepEqual(expected, [4]);
  const result = app.json(`analyzeDeck(${JSON.stringify(fixture)})`);
  assert.deepEqual(result.candidates, expected);
  assert.match(result.message, /Une seule carte candidate/);
});

test('analyzeDeck simule: branche plusieurs candidates', () => {
  const app = load();
  app.run('compatibleWithTwoRiffles = () => false; findCandidates = () => [2, 5, 17]');
  const result = app.json('analyzeDeck(deck)');
  assert.deepEqual(result.candidates, [2, 5, 17]);
  assert.match(result.message, /ambigu/);
  assert.match(result.message, /3 cartes possibles/);
  for (const candidate of result.candidates) assert.ok(result.message.includes(app.run(`cardName(${candidate})`)));
});

test('analyzeDeck reel: zero candidat ne signifie pas absence de rupture', () => {
  const app = load();
  const fixture = ordered(32).reverse();
  assert.equal(referenceCompatible(fixture), false);
  assert.deepEqual(referenceCandidates(fixture), []);
  const result = app.json(`analyzeDeck(${JSON.stringify(fixture)})`);
  assert.deepEqual(result.candidates, []);
  assert.match(result.message, /Aucune carte compatible trouv/);
  assert.match(result.message, /Cela ne signifie pas/);
  assert.doesNotMatch(result.message, /aucune rupture de s.quence d.tectable/i);
});

test('analyse et recherche independantes de selected, paquet final inchange', () => {
  const app = load();
  const fixture = history(47).final;
  app.run(`deck = ${JSON.stringify(fixture)}; step = 7; renderStep()`);
  const baseline = app.json('analyzeDeck(deck)');
  let marked;
  for (const selected of ['null', '0', '17', '31', '{ valueOf() { throw new Error("selected read"); } }']) {
    app.run(`selected = ${selected}`);
    assert.deepEqual(app.json('analyzeDeck(deck)'), baseline);
    assert.deepEqual(app.json('findCandidates(deck)'), referenceCandidates(fixture));
    app.run('searchCard()');
    const current = app.elements.deck.querySelectorAll('.card').map(card => card.classList.contains('marked'));
    assert.deepEqual(current, fixture.map(id => baseline.candidates.includes(id)));
    if (marked) assert.deepEqual(current, marked);
    marked = current;
    assert.deepEqual(app.json('deck'), fixture);
    assert.equal(app.elements.status.textContent, baseline.message);
  }
});

for (const reducedMotion of [false, true]) {
  test(`parcours UI entier: observer, coloration, recherche, verification (reducedMotion=${reducedMotion})`, async () => {
    const app = load({ reducedMotion });
    app.invoke(app.button('Commencer le tour'));
    for (const round of [1, 2]) {
      const before = app.json('deck');
      const pending = app.invoke(app.button(`Animer le riffle ${round}`));
      assert.equal(app.run('busy'), true);
      assert.equal(app.elements.shuffle.hidden, false);
      assert.ok(app.elements.controls.querySelectorAll('button').every(button => button.disabled));
      assert.equal(app.elements.left.children.length + app.elements.right.children.length, 32);
      const split = app.elements.left.children.length;
      assert.ok(split >= 12 && split <= 20);
      for (const [element, half] of [[app.elements.left, before.slice(0, split)],
        [app.elements.right, before.slice(split)]]) {
        assert.deepEqual(element.children.map(card => card.getAttribute('aria-label')),
          half.map(id => app.run(`cardName(${id})`)));
      }
      const secondCall = app.run('shuffle()');
      assert.equal(app.timers.size, 1, 'busy blocks a second animation');
      await secondCall;
      await app.tick();
      assert.equal(app.elements.merged.children.length, 1);
      assert.equal(app.elements.merged.firstElementChild.classList.contains('enter'), true);
      assert.equal(app.elements.left.children.length + app.elements.right.children.length, 31);
      await app.drain();
      await pending;
      const after = app.json('deck');
      assert.deepEqual(after.slice().sort((left, right) => left - right), ordered(32));
      for (const half of [before.slice(0, split), before.slice(split)]) {
        assert.deepEqual(after.filter(id => half.includes(id)), half);
      }
      assert.equal(app.elements.left.children.length, 0);
      assert.equal(app.elements.right.children.length, 0);
      assert.equal(app.run('busy'), false);
      assertStatus(app, /termin/);
      app.invoke(app.button('Continuer'));
    }
    assert.ok(app.delays.every(delay => delay === (reducedMotion ? 0 : 250)));
    assert.deepEqual(app.mediaQueries, Array(2).fill('(prefers-reduced-motion: reduce)'));
    const cut = count => {
      const range = app.elements.controls.querySelector('input');
      range.value = String(count);
      app.invoke(range, 'oninput');
      assert.equal(app.elements.controls.querySelector('output').textContent, `${count} cartes`);
      app.elements.deck.children.forEach((cell, index) => {
        assert.equal(cell.querySelector('.card').style.transform, index < count ? 'translateY(-8px)' : '');
        assert.equal(cell.querySelector('.card').classList.contains('cut-end'), index === count - 1);
      });
      const before = app.json('deck');
      app.invoke(app.button('Effectuer la coupe'));
      assert.deepEqual(app.json('deck'), rotate(before, count));
      assert.equal(app.elements.deck.children.at(-1).querySelector('.card').classList.contains('cut-end'), true);
    };
    cut(9);
    const selected = app.json('deck')[0];
    app.invoke(app.button('Prendre et voir la carte du dessus'));
    assert.equal(app.run('selected'), selected);
    assert.equal(app.run('deck.length'), 31);
    assert.equal(app.elements.held.querySelectorAll('.card').length, 1);
    assert.equal(app.elements.deck.querySelectorAll('.slot').length, 32);
    app.invoke(app.elements.deck.querySelectorAll('.slot')[13]);
    assert.equal(app.json('deck')[13], selected);
    cut(7);
    assert.equal(app.run('step'), 7);
    const finalDeck = app.json('deck');
    const previousStatus = app.elements.status.textContent;
    app.invoke(app.button('Colorer les s\u00e9quences'));
    const analysis = app.json('analyzeDeck(deck)');
    const { groups } = app.json('circularSequences(deck, analyzeDeck(deck).candidates)');
    const palette = app.json('colors');
    app.elements.deck.querySelectorAll('.card').forEach((card, index) => {
      assert.equal(card.classList.contains('sequence'), true);
      const isBreak = analysis.candidates.includes(finalDeck[index]);
      assert.equal(card.classList.contains('sequence-break'), isBreak);
      assert.equal(card.style.borderTopColor, isBreak ? '#df3547' : palette[groups[finalDeck[index]] % palette.length]);
    });
    assert.equal(app.elements.status.textContent, previousStatus);
    app.invoke(app.button('Rechercher automatiquement'));
    assert.equal(app.elements.status.textContent, analysis.message);
    app.invoke(app.button('Colorer les s\u00e9quences'));
    app.invoke(app.button('Colorer les s\u00e9quences'));
    assert.equal(app.elements.status.textContent, analysis.message);
    assert.equal(app.elements.statusTop.textContent, analysis.message);
    assert.deepEqual(app.elements.deck.querySelectorAll('.marked').map(card => card.getAttribute('aria-label')),
      finalDeck.filter(id => analysis.candidates.includes(id)).map(id => app.run(`cardName(${id})`)));
    app.invoke(app.button('V\u00e9rifier ma carte'));
    assert.equal(app.elements.deck.querySelectorAll('.marked').length, 1);
    assert.equal(app.elements.deck.querySelector('.marked').getAttribute('aria-label'), app.run(`cardName(${selected})`));
    assertStatus(app, new RegExp(`position ${finalDeck.indexOf(selected) + 1}\\.`));
    const verificationMessage = app.elements.status.textContent;
    app.invoke(app.button('Colorer les s\u00e9quences'));
    assert.equal(app.elements.status.textContent, verificationMessage);
    assert.deepEqual(app.json('deck'), finalDeck);
    app.invoke(app.button('Rechercher automatiquement'));
    assert.equal(app.elements.deck.querySelectorAll('.marked').length, analysis.candidates.length);
  });
}

test('sequences circulaires: 29, 30, 31, 0, 1 restent une seule sequence', () => {
  const app = load();
  for (const order of [rotate(ordered(32), 29), [29, 30, 31, 1, 2]]) {
    const result = app.json(`circularSequences(${JSON.stringify(order)})`);
    assert.equal(result.count, 1);
    assert.ok(order.every(id => result.groups[id] === 0));
  }
  assert.deepEqual(app.json('circularSequences([])'), { groups: [], count: 0 });
});

test('sequences circulaires: une coupe conserve les groupes et leurs couleurs', () => {
  const app = load();
  for (const order of [history(29).final, history(47).final, ordered(32).reverse()]) {
    for (const excluded of [[], [4]]) {
      const expected = app.json(`circularSequences(${JSON.stringify(order)}, ${JSON.stringify(excluded)})`);
      for (let cut = 0; cut < order.length; cut++) {
        assert.deepEqual(app.json(`circularSequences(${JSON.stringify(rotate(order, cut))}, ${JSON.stringify(excluded)})`), expected);
      }
    }
  }
});

test('coloration: la candidate a une couleur distincte sans utiliser selected', () => {
  const app = load();
  const fixture = ordered(8).flatMap(index => [index, index + 8, index + 16, index + 24]);
  fixture.splice(fixture.indexOf(4), 1);
  fixture.splice(25, 0, 4);
  app.run(`deck = ${JSON.stringify(fixture)}; selected = null; step = 7; renderStep(); highlightSequences()`);
  assert.deepEqual(app.json('analyzeDeck(deck).candidates'), [4]);
  assert.equal(app.elements.deck.querySelectorAll('.sequence-break').length, 1);
  const breaker = app.elements.deck.querySelector('.sequence-break');
  assert.equal(breaker.getAttribute('aria-label'), app.run('cardName(4)'));
  assert.equal(breaker.style.borderTopColor, '#df3547');
  assert.ok(app.elements.deck.querySelectorAll('.card').filter(card => card !== breaker)
    .every(card => card.style.borderTopColor !== '#df3547'));
  assert.deepEqual(app.json('deck'), fixture);
});

test('UI: coloration activable et desactivable sans effacer le resultat ni les reperes', () => {
  const app = load();
  app.run('step = 7; selected = 4; cutEnd = 31; renderStep(); searchCard()');
  const message = app.elements.status.textContent;
  const button = app.button('Colorer les s\u00e9quences');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  app.invoke(button);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(app.elements.deck.querySelectorAll('.sequence').length, 32);
  app.run('document.getElementById("deck").children[4].querySelector(".card").classList.add("marked")');
  app.invoke(button);
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(app.elements.deck.querySelectorAll('.sequence').length, 0);
  assert.equal(app.elements.deck.querySelectorAll('.sequence-break').length, 0);
  assert.equal(app.elements.deck.querySelectorAll('.marked').length, 1);
  assert.equal(app.elements.deck.querySelectorAll('.cut-end').length, 1);
  assert.ok(app.elements.deck.querySelectorAll('.card').every(card => card.style.borderTopColor === '' && card.title === ''));
  assert.equal(app.elements.status.textContent, message);
  assert.equal(app.elements.statusTop.textContent, message);
  app.invoke(button);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(app.elements.deck.querySelectorAll('.sequence').length, 32);
});

test('UI: continuer sans coupe et reinserer tout a la fin', () => {
  const app = load();
  app.run('step = 3; renderStep()');
  const before = app.json('deck');
  app.invoke(app.button('Continuer sans couper'));
  assert.deepEqual(app.json('deck'), before);
  app.invoke(app.button('Prendre et voir la carte du dessus'));
  app.invoke(app.elements.deck.children.at(-1));
  assert.deepEqual(app.json('deck'), [...before.slice(1), before[0]]);
  app.invoke(app.button('Continuer sans couper'));
  assert.equal(app.run('step'), 7);
});

test('reset pendant shuffle: ancienne animation annulee, nouvelle partie preservee', async () => {
  const app = load();
  app.invoke(app.button('Commencer le tour'));
  const obsolete = app.invoke(app.button('Animer le riffle 1'));
  await app.tick();
  assert.equal(app.elements.merged.children.length, 1);
  app.invoke(app.elements.reset);
  const generation = app.run('generation');
  assert.deepEqual(app.json('deck'), ordered(32));
  assert.equal(app.elements.shuffle.hidden, true);
  await app.drain();
  await obsolete;
  assert.deepEqual(app.json('({ deck, step, selected, busy, generation })'),
    { deck: ordered(32), step: 0, selected: null, busy: false, generation });
  assert.equal(app.elements.status.textContent, '');
  app.button('Commencer le tour');
});

test('reset puis nouveau shuffle: ancienne continuation ne debloque ni ne corrompt le nouveau melange', async () => {
  const app = load();
  app.invoke(app.button('Commencer le tour'));
  const obsolete = app.invoke(app.button('Animer le riffle 1'));
  app.invoke(app.elements.reset);
  app.invoke(app.button('Commencer le tour'));
  const current = app.invoke(app.button('Animer le riffle 1'));
  const status = app.elements.status.textContent;
  assert.equal(app.timers.size, 2);
  await app.tick();
  await obsolete;
  assert.equal(app.run('busy'), true);
  assert.equal(app.run('step'), 1);
  assert.deepEqual(app.json('deck'), ordered(32));
  assert.equal(app.elements.merged.children.length, 0);
  assert.equal(app.elements.status.textContent, status);
  assert.ok(app.button('Animer le riffle 1').disabled);
  await app.drain();
  await current;
  assert.equal(app.run('busy'), false);
  assert.equal(app.elements.merged.children.length, 32);
  assert.deepEqual(app.json('deck').slice().sort((left, right) => left - right), ordered(32));
  app.invoke(app.button('Continuer'));
  assert.equal(app.run('step'), 2);
});