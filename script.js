(function () {
  'use strict';

  // ---------- Word pool ----------
  var WORD_POOL = [
    "the","quick","brown","fox","jumps","over","lazy","dog","time","light",
    "world","人","space","water","stone","river","mountain","forest","ocean","desert",
    "simple","complex","random","order","chaos","system","pattern","design","build","create",
    "focus","speed","typing","keyboard","practice","improve","skill","mind","body","flow",
    "quiet","loud","bright","dark","color","shape","form","function","value","logic",
    "code","data","script","program","function","variable","object","array","string","number",
    "future","past","present","moment","second","minute","hour","day","week","month",
    "simple","honest","clear","direct","open","closed","wide","narrow","deep","shallow",
    "music","sound","silence","noise","voice","whisper","shout","echo","rhythm","beat",
    "travel","journey","road","path","trail","map","compass","direction","distance","destination",
    "coffee","morning","evening","night","dawn","dusk","sunrise","sunset","cloud","rain",
    "steady","calm","sharp","smooth","rough","soft","hard","solid","fluid","clear"
  ];

  function generateParagraph(wordCount) {
    var words = [];
    for (var i = 0; i < wordCount; i++) {
      words.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
    }
    var text = words.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  }

  // ---------- DOM references ----------
  var paragraphEl = document.getElementById('paragraph');
  var typingAreaEl = document.getElementById('typingArea');
  var hiddenInput = document.getElementById('hiddenInput');
  var focusHint = document.getElementById('focusHint');
  var restartBtn = document.getElementById('restartBtn');
  var retryBtn = document.getElementById('retryBtn');
  var durationSelector = document.getElementById('durationSelector');
  var resultsScreen = document.getElementById('resultsScreen');
  var mainEl = document.querySelector('.main');
  var caretEl = document.getElementById('caret');
  var keyboardEl = document.getElementById('keyboard');
  var kbKeyMap = {};
  (function buildKbMap() {
    var keys = keyboardEl.querySelectorAll('.kb-key');
    for (var i = 0; i < keys.length; i++) {
      var code = keys[i].getAttribute('data-code');
      kbKeyMap[code] = keys[i];
    }
  })();

  var statWpm = document.getElementById('statWpm');
  var statAccuracy = document.getElementById('statAccuracy');
  var statTime = document.getElementById('statTime');
  var statCorrect = document.getElementById('statCorrect');
  var statIncorrect = document.getElementById('statIncorrect');

  var resultWpm = document.getElementById('resultWpm');
  var resultAccuracy = document.getElementById('resultAccuracy');
  var resultCorrect = document.getElementById('resultCorrect');
  var resultErrors = document.getElementById('resultErrors');

  // ---------- State ----------
  var state = {
    duration: 15,
    timeRemaining: 15,
    timerId: null,
    started: false,
    finished: false,
    targetText: '',
    charStates: [],   // 'pending' | 'correct' | 'incorrect'
    typedCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    tabPressed: false
  };

  var WORDS_FOR_DURATION = {
    15: 40,
    30: 70,
    60: 130,
    120: 240
  };

  // ---------- Rendering ----------
  function renderParagraph() {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < state.targetText.length; i++) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = state.targetText[i];
      frag.appendChild(span);
    }
    paragraphEl.innerHTML = '';
    paragraphEl.appendChild(frag);
    updateCurrentMarker();
  }

  function updateCurrentMarker() {
    var spans = paragraphEl.children;
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.remove('current');
    }
    if (state.typedCount < spans.length && !state.finished) {
      spans[state.typedCount].classList.add('current');
    }
    updateCaretPosition();
  }

  function updateCaretPosition() {
    var spans = paragraphEl.children;
    if (state.finished || spans.length === 0) {
      caretEl.classList.remove('visible');
      return;
    }
    var index = Math.min(state.typedCount, spans.length - 1);
    var target = spans[index];
    if (!target) return;

    var atEnd = state.typedCount >= spans.length;
    var top = target.offsetTop - paragraphEl.scrollTop;
    var left = atEnd ? target.offsetLeft + target.offsetWidth : target.offsetLeft;
    var height = target.offsetHeight;

    caretEl.style.height = height + 'px';
    caretEl.style.transform = 'translate(' + left + 'px, ' + top + 'px)';
    caretEl.classList.add('visible');
  }

  function updateCharDisplay(index, status) {
    var span = paragraphEl.children[index];
    if (!span) return;
    span.classList.remove('correct', 'incorrect');
    if (status === 'correct') span.classList.add('correct');
    if (status === 'incorrect') span.classList.add('incorrect');
  }

  function scrollParagraphIfNeeded() {
    var spans = paragraphEl.children;
    if (state.typedCount >= spans.length) return;
    var currentSpan = spans[state.typedCount];
    var lineHeight = parseFloat(getComputedStyle(paragraphEl).lineHeight);
    var relativeTop = currentSpan.offsetTop - paragraphEl.scrollTop;
    var visibleLines = 3;
    if (relativeTop >= lineHeight * (visibleLines - 1)) {
      paragraphEl.scrollTop = currentSpan.offsetTop - lineHeight * (visibleLines - 2);
    } else if (relativeTop < 0) {
      paragraphEl.scrollTop = currentSpan.offsetTop;
    }
    updateCaretPosition();
  }

  // ---------- Stats ----------
  function calculateWpm() {
    var elapsedMinutes = (state.duration - state.timeRemaining) / 60;
    if (elapsedMinutes <= 0) return 0;
    var wpm = (state.correctCount / 5) / elapsedMinutes;
    return Math.round(wpm < 0 ? 0 : wpm);
  }

  function calculateAccuracy() {
    if (state.totalKeystrokes === 0) return 100;
    var acc = (state.correctKeystrokes / state.totalKeystrokes) * 100;
    return Math.max(0, Math.round(acc));
  }

  function updateStatsDisplay() {
    statWpm.textContent = calculateWpm();
    statAccuracy.textContent = calculateAccuracy() + '%';
    statTime.textContent = state.timeRemaining;
    statCorrect.textContent = state.correctCount;
    statIncorrect.textContent = state.incorrectCount;
  }

  // ---------- Timer ----------
  function startTimer() {
    if (state.timerId) return;
    state.started = true;
    typingAreaEl.classList.remove('blurred');
    focusHint.classList.remove('visible');
    state.timerId = setInterval(function () {
      state.timeRemaining--;
      updateStatsDisplay();
      if (state.timeRemaining <= 0) {
        finishTest();
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  // ---------- Input handling ----------
  function handleInput(e) {
    if (state.finished) return;
    if (e && e.isComposing) return;

    var value = hiddenInput.value;

    if (value.length > state.typedCount) {
      // character(s) typed forward
      var newChars = value.slice(state.typedCount);
      for (var i = 0; i < newChars.length; i++) {
        if (state.typedCount >= state.targetText.length) break;
        if (!state.started) startTimer();

        var typedChar = newChars[i];
        var targetChar = state.targetText[state.typedCount];
        state.totalKeystrokes++;

        if (typedChar === targetChar) {
          state.charStates[state.typedCount] = 'correct';
          state.correctCount++;
          state.correctKeystrokes++;
          updateCharDisplay(state.typedCount, 'correct');
        } else {
          state.charStates[state.typedCount] = 'incorrect';
          state.incorrectCount++;
          updateCharDisplay(state.typedCount, 'incorrect');
        }
        state.typedCount++;
      }
    } else if (value.length < state.typedCount) {
      // backspace
      var removeCount = state.typedCount - value.length;
      for (var j = 0; j < removeCount; j++) {
        state.typedCount--;
        if (state.typedCount < 0) { state.typedCount = 0; break; }
        var prevStatus = state.charStates[state.typedCount];
        if (prevStatus === 'correct') state.correctCount--;
        if (prevStatus === 'incorrect') state.incorrectCount--;
        state.charStates[state.typedCount] = 'pending';
        updateCharDisplay(state.typedCount, 'pending');
      }
    }

    updateCurrentMarker();
    scrollParagraphIfNeeded();
    updateStatsDisplay();

    if (state.typedCount >= state.targetText.length) {
      finishTest();
      return;
    }

    // keep hidden input in sync, trim to avoid unbounded growth
    if (hiddenInput.value.length > 500) {
      hiddenInput.value = hiddenInput.value.slice(-50);
    }
  }

  // ---------- Test lifecycle ----------
  function setupTest() {
    stopTimer();
    state.timeRemaining = state.duration;
    state.started = false;
    state.finished = false;
    state.typedCount = 0;
    state.correctCount = 0;
    state.incorrectCount = 0;
    state.totalKeystrokes = 0;
    state.correctKeystrokes = 0;
    state.targetText = generateParagraph(WORDS_FOR_DURATION[state.duration] || 40);
    state.charStates = new Array(state.targetText.length).fill('pending');

    hiddenInput.value = '';
    renderParagraph();
    updateStatsDisplay();
    paragraphEl.scrollTop = 0;

    resultsScreen.classList.remove('visible');
    mainEl.style.display = 'flex';

    typingAreaEl.classList.add('blurred');
    focusHint.classList.add('visible');
  }

  function finishTest() {
    if (state.finished) return;
    state.finished = true;
    stopTimer();
    hiddenInput.blur();
    caretEl.classList.remove('visible');
    var activeKeys = keyboardEl.querySelectorAll('.kb-key.active');
    for (var k = 0; k < activeKeys.length; k++) activeKeys[k].classList.remove('active');

    var finalWpm = calculateWpm();
    var finalAccuracy = calculateAccuracy();

    resultWpm.textContent = finalWpm;
    resultAccuracy.textContent = finalAccuracy + '%';
    resultCorrect.textContent = state.correctCount;
    resultErrors.textContent = state.incorrectCount;

    mainEl.style.display = 'none';
    resultsScreen.classList.add('visible');
  }

  function restartTest() {
    setupTest();
    focusInput();
  }

  function focusInput() {
    hiddenInput.focus();
  }

  // ---------- Event listeners ----------
  hiddenInput.addEventListener('input', handleInput);
  hiddenInput.addEventListener('compositionend', handleInput);

  hiddenInput.addEventListener('blur', function () {
    if (!state.finished && !state.started) {
      typingAreaEl.classList.add('blurred');
      focusHint.classList.add('visible');
    }
    caretEl.classList.remove('visible');
  });

  hiddenInput.addEventListener('focus', function () {
    if (!state.finished) {
      typingAreaEl.classList.remove('blurred');
      focusHint.classList.remove('visible');
      updateCaretPosition();
    }
  });

  hiddenInput.addEventListener('keydown', function (e) {
    var key = kbKeyMap[e.code];
    if (key) key.classList.add('active');
  });

  hiddenInput.addEventListener('keyup', function (e) {
    var key = kbKeyMap[e.code];
    if (key) key.classList.remove('active');
  });

  window.addEventListener('resize', updateCaretPosition);

  typingAreaEl.addEventListener('click', focusInput);
  focusHint.addEventListener('click', focusInput);

  restartBtn.addEventListener('click', restartTest);
  retryBtn.addEventListener('click', restartTest);

  durationSelector.addEventListener('click', function (e) {
    var btn = e.target.closest('.duration-btn');
    if (!btn) return;
    var dur = parseInt(btn.getAttribute('data-duration'), 10);
    state.duration = dur;

    var buttons = durationSelector.querySelectorAll('.duration-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('active');
    }
    btn.classList.add('active');

    setupTest();
  });

  // Prevent unwanted browser shortcuts / text selection during test
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      state.tabPressed = true;
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && state.tabPressed) {
      e.preventDefault();
      restartTest();
      state.tabPressed = false;
      return;
    }

    // Prevent space from scrolling the page when not focused on input
    if (e.key === ' ' && document.activeElement !== hiddenInput) {
      if (!state.finished) {
        e.preventDefault();
        focusInput();
      }
    }

    // Block common browser shortcuts that would interfere
    if ((e.ctrlKey || e.metaKey) && ['a', 's', 'p', 'f'].indexOf(e.key.toLowerCase()) !== -1) {
      if (document.activeElement === hiddenInput) {
        e.preventDefault();
      }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (e.key === 'Tab') {
      setTimeout(function () { state.tabPressed = false; }, 400);
    }
  });

  // Auto-focus hidden input on any printable key press when idle
  document.addEventListener('keydown', function (e) {
    if (state.finished) return;
    if (document.activeElement === hiddenInput) return;
    if (e.key.length === 1 || e.key === 'Backspace') {
      focusInput();
    }
  });

  // Prevent text selection / context menu inside typing area
  typingAreaEl.addEventListener('selectstart', function (e) { e.preventDefault(); });
  typingAreaEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- Init ----------
  setupTest();
})();
