/* ClaudeFarm client — vanilla JS, no framework. */
(function () {
  'use strict';

  // ---------- analytics (privacy-conscious beacons) ----------
  function track(event, props) {
    try {
      const body = JSON.stringify({ event: event, props: props || {} });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) { /* never break UX for analytics */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    track('page_view', { path: document.body.getAttribute('data-path') || location.pathname });
    wireDataEvents();
    wireDemo();
    wireCopy();
    wireCheckout();
    wireQuiz();
  });

  // Elements with data-event fire that event on click (also product/tier).
  function wireDataEvents() {
    document.querySelectorAll('[data-event]').forEach(function (el) {
      if (el.id === 'demo-run') return; // handled by demo
      if (el.hasAttribute('data-checkout')) return; // handled by checkout
      el.addEventListener('click', function () {
        track(el.getAttribute('data-event'), {
          product: el.getAttribute('data-product') || undefined,
          tier: el.getAttribute('data-tier') || undefined
        });
      });
    });
  }

  // ---------- live demo ----------
  function wireDemo() {
    var runBtn = document.getElementById('demo-run');
    var input = document.getElementById('demo-input');
    var output = document.getElementById('demo-output');
    if (!runBtn || !input || !output) return;

    function run() {
      var raw = input.value.trim();
      var parts = raw.split(/\s+/);
      var command = (parts.shift() || 'budget').toLowerCase();
      var rest = parts.join(' ');
      track('demo_started', { command: command });
      runBtn.disabled = true;
      var prev = runBtn.textContent;
      runBtn.textContent = 'Running…';
      output.textContent = 'Running ' + command + '…';
      output.classList.remove('is-error');

      fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command, input: rest })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.ok) {
            output.textContent = data.output; // textContent = no XSS
            track('demo_completed', { command: data.command });
          } else {
            output.textContent = data.error || 'That command is not available in the demo. Try "budget".';
            output.classList.add('is-error');
          }
        })
        .catch(function () {
          output.textContent = 'The demo could not reach the server. Check your connection and try again.';
          output.classList.add('is-error');
        })
        .finally(function () {
          runBtn.disabled = false;
          runBtn.textContent = prev;
        });
    }

    runBtn.addEventListener('click', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  }

  // ---------- copy buttons ----------
  function wireCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var done = function () {
          var prev = btn.textContent;
          btn.textContent = 'Copied ✓';
          setTimeout(function () { btn.textContent = prev; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else { fallback(); }
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    });
  }

  // ---------- checkout ----------
  function wireCheckout() {
    document.querySelectorAll('[data-checkout]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-checkout');
        track('checkout_started', { product: slug, tier: btn.getAttribute('data-tier') || undefined });
        var prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Starting checkout…';
        fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: slug })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.ok && data.url) { window.location.href = data.url; return; }
            if (data.redirect) { window.location.href = data.redirect; return; }
            showInlineError(btn, 'Checkout could not start. Please try again.');
            btn.disabled = false; btn.textContent = prev;
          })
          .catch(function () {
            showInlineError(btn, 'Network error starting checkout. Please try again.');
            btn.disabled = false; btn.textContent = prev;
          });
      });
    });
  }

  function showInlineError(near, msg) {
    var note = document.createElement('span');
    note.className = 'inline-error';
    note.setAttribute('role', 'alert');
    note.textContent = ' ' + msg;
    near.insertAdjacentElement('afterend', note);
    setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 5000);
  }

  // ---------- product finder quiz ----------
  var QUIZ = {
    questions: [
      {
        q: 'What are you trying to do with Claude?',
        options: [
          { label: 'Just see if this is legit', score: { 'free-budget': 3 } },
          { label: 'Work with big documents or long context', score: { 'context-cookbook': 3 } },
          { label: 'Build my own reusable Claude skills', score: { 'skill-farmers-toolkit': 3 } },
          { label: 'Equip myself/my team with everything', score: { 'whole-farm': 3 } }
        ]
      },
      {
        q: 'How often will you use it?',
        options: [
          { label: 'Just trying things out', score: { 'free-budget': 2 } },
          { label: 'Regularly, for real work', score: { 'context-cookbook': 1, 'skill-farmers-toolkit': 1 } },
          { label: "It's core to what I do", score: { 'skill-farmers-toolkit': 1, 'whole-farm': 2 } }
        ]
      },
      {
        q: "What's your budget?",
        options: [
          { label: 'Free only, for now', score: { 'free-budget': 3 } },
          { label: 'A few dollars for the right tool', score: { 'context-cookbook': 2 } },
          { label: 'Whatever saves me the most time', score: { 'whole-farm': 2, 'skill-farmers-toolkit': 1 } }
        ]
      }
    ]
  };

  function wireQuiz() {
    var mount = document.getElementById('quiz');
    if (!mount) return;
    track('product_selector_started', {});
    var step = 0;
    var scores = {};

    function render() {
      if (step >= QUIZ.questions.length) { return finish(); }
      var question = QUIZ.questions[step];
      mount.innerHTML = '';
      var progress = document.createElement('p');
      progress.className = 'quiz-progress muted small';
      progress.textContent = 'Question ' + (step + 1) + ' of ' + QUIZ.questions.length;
      var h = document.createElement('h2');
      h.textContent = question.q;
      mount.appendChild(progress);
      mount.appendChild(h);
      question.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'btn btn-ghost quiz-option';
        b.type = 'button';
        b.textContent = opt.label;
        b.addEventListener('click', function () {
          Object.keys(opt.score).forEach(function (k) { scores[k] = (scores[k] || 0) + opt.score[k]; });
          step += 1;
          render();
        });
        mount.appendChild(b);
      });
    }

    function finish() {
      var best = null; var bestScore = -1;
      Object.keys(scores).forEach(function (k) { if (scores[k] > bestScore) { bestScore = scores[k]; best = k; } });
      best = best || 'free-budget';
      track('product_selector_completed', { product: best });
      fetch('/api/product/' + best)
        .then(function (r) { return r.json(); })
        .then(function (p) { showResult(p); })
        .catch(function () { showResult(null, best); });
    }

    function showResult(p, fallbackId) {
      mount.innerHTML = '';
      var h = document.createElement('h2');
      h.textContent = 'Your match';
      mount.appendChild(h);
      if (!p) {
        var link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = '/p/' + (fallbackId || 'budget');
        link.textContent = 'See your recommended product →';
        mount.appendChild(link);
        return;
      }
      var card = document.createElement('div');
      card.className = 'quiz-result';
      card.innerHTML =
        '<div class="tier tier-' + p.tier + '">' + escapeHtml(p.tier) + '</div>' +
        '<h3>' + escapeHtml(p.name) + ' — ' + escapeHtml(p.priceLabel) + '</h3>' +
        '<p>' + escapeHtml(p.oneLiner) + '</p>';
      var actions = document.createElement('div');
      actions.className = 'hero-cta';
      var view = document.createElement('a');
      view.className = 'btn btn-primary';
      view.href = '/p/' + p.slug;
      view.textContent = 'See ' + p.name + ' →';
      view.addEventListener('click', function () { track('product_view', { product: p.id }); });
      actions.appendChild(view);
      var restart = document.createElement('button');
      restart.className = 'btn btn-ghost';
      restart.type = 'button';
      restart.textContent = 'Start over';
      restart.addEventListener('click', function () { step = 0; scores = {}; render(); });
      actions.appendChild(restart);
      card.appendChild(actions);
      mount.appendChild(card);
    }

    function escapeHtml(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    render();
  }
})();
