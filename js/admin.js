// ============================================================
// Admin-side: innlogging (Supabase Auth) + bordbestillinger.
// Denne siden er IKKE lenket fra noe sted på det offentlige nettstedet
// og har <meta name="robots" content="noindex, nofollow">, men den er
// likevel bare beskyttet av innlogging — del aldri lenken offentlig.
//
// Bruker samme Supabase-auth (samme brukere) som Lørenskog Dyrebutikks
// admin, siden det er samme delte prosjekt.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const adminView = document.getElementById('admin-view');
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  const logoutBtn = document.getElementById('logout-btn');
  const configWarning = document.getElementById('config-warning');

  if (!window.supabaseClient) {
    configWarning.hidden = false;
    loginForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    return;
  }
  const sb = window.supabaseClient;

  // ---------- Auth ----------
  function showLoggedIn() {
    loginView.hidden = true;
    adminView.hidden = false;
    logoutBtn.hidden = false;
    loadBookings();
  }
  function showLoggedOut() {
    loginView.hidden = false;
    adminView.hidden = true;
    logoutBtn.hidden = true;
  }

  sb.auth.getSession().then(({ data }) => {
    if (data.session) showLoggedIn(); else showLoggedOut();
  });

  sb.auth.onAuthStateChange((_event, session) => {
    if (session) showLoggedIn(); else showLoggedOut();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginStatus.textContent = 'Logger inn …';
    loginStatus.className = 'form-status';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      loginStatus.textContent = 'Feil e-post eller passord.';
      loginStatus.className = 'form-status is-error';
      return;
    }
    loginStatus.textContent = '';
  });

  logoutBtn.addEventListener('click', () => sb.auth.signOut());

  // ---------- Bordbestillinger ----------
  const bookingsTbody = document.getElementById('bookings-tbody');
  const bookingsEmpty = document.getElementById('bookings-empty');
  const bookingsArchivedNote = document.getElementById('bookings-archived-note');
  const showArchivedCheckbox = document.getElementById('show-archived');
  const STATUS_OPTIONS = ['ny', 'bekreftet', 'avvist', 'fullført'];
  const ARCHIVED_STATUSES = ['fullført', 'avvist'];

  async function loadBookings() {
    const { data, error } = await sb.from('restaurant_bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    const showArchived = showArchivedCheckbox.checked;
    const archivedCount = data.filter(b => ARCHIVED_STATUSES.includes(b.status)).length;
    const visible = showArchived ? data : data.filter(b => !ARCHIVED_STATUSES.includes(b.status));

    bookingsTbody.innerHTML = '';
    bookingsEmpty.hidden = data.length > 0;
    bookingsArchivedNote.hidden = showArchived || archivedCount === 0;
    bookingsArchivedNote.textContent = `${archivedCount} fullført${archivedCount === 1 ? '' : 'e'}/avviste booking${archivedCount === 1 ? '' : 'er'} er arkivert og skjult — kryss av "Vis arkiv" for å se dem.`;

    visible.forEach(b => {
      const tr = document.createElement('tr');
      tr.dataset.status = b.status;

      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      statusSelect.dataset.status = b.status;
      STATUS_OPTIONS.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === b.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', async () => {
        const newStatus = statusSelect.value;
        tr.dataset.status = newStatus;
        statusSelect.dataset.status = newStatus;
        await sb.from('restaurant_bookings').update({ status: newStatus }).eq('id', b.id);
        if (ARCHIVED_STATUSES.includes(newStatus) && !showArchivedCheckbox.checked) {
          loadBookings();
        }
      });

      const cells = [
        new Date(b.created_at).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' }),
        b.name, b.phone, b.email || '–',
        b.guests, b.booking_date || '–', b.booking_time || '–',
        b.message || '–',
      ];
      cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });

      const statusTd = document.createElement('td');
      statusTd.appendChild(statusSelect);
      tr.appendChild(statusTd);

      bookingsTbody.appendChild(tr);
    });
  }
  document.getElementById('refresh-bookings').addEventListener('click', loadBookings);
  showArchivedCheckbox.addEventListener('change', loadBookings);
});
