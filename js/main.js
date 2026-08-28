// Fjellhamar Bistro — delt interaktivitet uten backend
// (booking-innsending ligger i js/booking.js)

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobilmeny ---
  const burger = document.querySelector('.hamburger');
  const mobMenu = document.getElementById('mobMenu');
  if (burger && mobMenu) {
    burger.addEventListener('click', () => {
      mobMenu.classList.toggle('open');
    });
    mobMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobMenu.classList.remove('open'));
    });
    window.addEventListener('scroll', () => mobMenu.classList.remove('open'));
  }

  // --- Footer årstall ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Dagens rad i åpningstider-tabellen ---
  const now = new Date();
  const nowOslo = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const dayIndex = nowOslo.getDay(); // 0 = søndag ... 6 = lørdag

  document.querySelectorAll('.hours-table').forEach(table => {
    const row = table.querySelector(`tr[data-day="${dayIndex}"]`);
    if (row) row.classList.add('is-today');
  });

  // --- "Åpent nå" / "Stengt nå"-status i hero ---
  const statusEl = document.getElementById('open-status');
  if (statusEl) {
    const tableId = statusEl.dataset.hoursTable || 'hours-main';
    const toMinutes = t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const getRow = d => document.querySelector(`#${tableId} tr[data-day="${d}"]`);
    const getHours = d => {
      const row = getRow(d);
      if (!row) return null;
      const text = row.children[1].textContent.trim();
      if (text.toLowerCase() === 'stengt') return null;
      const [start, end] = text.split('–').map(s => s.trim());
      return { start, end };
    };

    const todayHours = getHours(dayIndex);
    const nowMinutes = nowOslo.getHours() * 60 + nowOslo.getMinutes();
    const isOpenNow = todayHours
      && nowMinutes >= toMinutes(todayHours.start)
      && nowMinutes < toMinutes(todayHours.end);

    statusEl.classList.add(isOpenNow ? 'is-open' : 'is-closed');
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    statusEl.appendChild(dot);
    const text = document.createElement('span');
    if (isOpenNow) {
      text.textContent = `Åpent nå · stenger ${todayHours.end}`;
    } else if (todayHours) {
      text.textContent = nowMinutes < toMinutes(todayHours.start)
        ? `Stengt nå · åpner ${todayHours.start} i dag`
        : 'Stengt nå · åpner i morgen';
    } else {
      text.textContent = 'Stengt nå';
    }
    statusEl.appendChild(text);
  }

  // --- Menyflikar ---
  document.querySelectorAll('.mtab').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-tab');
      document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.mpanel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + name).classList.add('active');
    });
  });

  // --- Footer-lenker som bytter menyflik ---
  document.querySelectorAll('a[data-switchtab]').forEach(link => {
    link.addEventListener('click', () => {
      const name = link.getAttribute('data-switchtab');
      document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.mpanel').forEach(p => p.classList.remove('active'));
      const tab = document.querySelector(`.mtab[data-tab="${name}"]`);
      const panel = document.getElementById('panel-' + name);
      if (tab) tab.classList.add('active');
      if (panel) panel.classList.add('active');
    });
  });

});
