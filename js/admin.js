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
  // Statusflyt (samme mønster/mal som Lørenskog Dyrebutikk sin
  // bookingadmin — samme statusverdier lagres i databasen på begge
  // steder, kun visningsteksten for "fullført" er tilpasset denne
  // virksomheten):
  //   ny        → kommer inn automatisk, krever manuell håndtering
  //   bekreftet → dere har ringt/bekreftet bordet med gjesten
  //   avbestilt → gjesten har avbestilt (skriv gjerne årsak i notatet)
  //   ikke møtt → gjesten dukket ikke opp (og avbestilte heller ikke)
  //   ankommet  → gjesten har ankommet — arkiveres automatisk
  // avbestilt / ikke møtt / ankommet arkiveres (skjules fra hoved-
  // listen) med mindre "Vis arkiv" er krysset av.
  const bookingsTbody = document.getElementById('bookings-tbody');
  const bookingsEmpty = document.getElementById('bookings-empty');
  const bookingsArchivedNote = document.getElementById('bookings-archived-note');
  const showArchivedCheckbox = document.getElementById('show-archived');
  const STATUS_LABELS = {
    ny: 'Ny',
    bekreftet: 'Bekreftet',
    avbestilt: 'Avbestilt',
    ikke_møtt: 'Ikke møtt',
    fullført: 'Ankommet',
  };
  const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
  const ARCHIVED_STATUSES = ['avbestilt', 'ikke_møtt', 'fullført'];

  // Kort visuell bekreftelse ("grønn glimt") når et fritekstfelt er
  // lagret til Supabase — brukes av "Internt notat".
  function flashSaved(el) {
    el.classList.add('is-saved');
    setTimeout(() => el.classList.remove('is-saved'), 900);
  }

  async function loadBookings() {
    const { data, error } = await sb.from('restaurant_bookings').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    const showArchived = showArchivedCheckbox.checked;
    const archivedCount = data.filter(b => ARCHIVED_STATUSES.includes(b.status)).length;
    const visible = showArchived ? data : data.filter(b => !ARCHIVED_STATUSES.includes(b.status));

    bookingsTbody.innerHTML = '';
    bookingsEmpty.hidden = data.length > 0;
    bookingsArchivedNote.hidden = showArchived || archivedCount === 0;
    bookingsArchivedNote.textContent = `${archivedCount} avbestilt/ikke møtt/ankommet booking${archivedCount === 1 ? '' : 'er'} er arkivert og skjult — kryss av «Vis arkiv» for å se dem.`;

    visible.forEach(b => {
      const tr = document.createElement('tr');
      tr.dataset.status = b.status;

      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      statusSelect.dataset.status = b.status;

      // Liten statuslinje under nedtrekksmenyen som viser om/når
      // bekreftelses-e-post er sendt til gjesten.
      const emailNoteEl = document.createElement('div');
      emailNoteEl.className = 'email-status small muted';
      if (b.confirmation_sent_at) {
        emailNoteEl.textContent = `✓ Bekreftelse sendt ${new Date(b.confirmation_sent_at).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}`;
      }

      STATUS_OPTIONS.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = STATUS_LABELS[s];
        if (s === b.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener('change', async () => {
        const previousStatus = b.status;
        const newStatus = statusSelect.value;
        tr.dataset.status = newStatus;
        statusSelect.dataset.status = newStatus;
        statusSelect.disabled = true;

        const { error: updateError } = await sb.from('restaurant_bookings').update({ status: newStatus }).eq('id', b.id);
        if (updateError) {
          // Lagringen feilet — rull tilbake visningen i stedet for å late
          // som endringen gikk gjennom (den gjorde ikke det).
          console.error(updateError);
          tr.dataset.status = previousStatus;
          statusSelect.dataset.status = previousStatus;
          statusSelect.value = previousStatus;
          statusSelect.disabled = false;
          alert('Kunne ikke lagre statusendringen. Prøv igjen.');
          return;
        }
        b.status = newStatus;
        statusSelect.disabled = false;

        // Ved "Bekreftet": send bekreftelses-e-post med avbestillingslenke
        // automatisk, hvis gjesten har oppgitt e-post.
        if (newStatus === 'bekreftet' && previousStatus !== 'bekreftet') {
          sendConfirmationEmail(b, emailNoteEl);
        }

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

      // Internt notat — fritekst kun for ansatte (f.eks. årsak til
      // avbestilling, spesielle ønsker). Lagres når feltet forlates.
      const noteTd = document.createElement('td');
      const noteInput = document.createElement('textarea');
      noteInput.className = 'admin-note';
      noteInput.rows = 1;
      noteInput.placeholder = 'Notat …';
      noteInput.value = b.admin_comment || '';
      noteInput.addEventListener('blur', async () => {
        const value = noteInput.value.trim();
        if (value === (b.admin_comment || '')) return;
        const { error: saveError } = await sb.from('restaurant_bookings').update({ admin_comment: value || null }).eq('id', b.id);
        if (!saveError) { b.admin_comment = value; flashSaved(noteInput); }
      });
      noteTd.appendChild(noteInput);
      tr.appendChild(noteTd);

      const statusTd = document.createElement('td');
      statusTd.appendChild(statusSelect);
      statusTd.appendChild(emailNoteEl);
      tr.appendChild(statusTd);

      bookingsTbody.appendChild(tr);
    });
  }
  document.getElementById('refresh-bookings').addEventListener('click', loadBookings);
  showArchivedCheckbox.addEventListener('change', loadBookings);

  // Sender bekreftelses-e-post (med avbestillingslenke) via Edge Function
  // "send-confirmation". Krever at gjesten har oppgitt e-post, og at
  // Supabase-hemmeligheten RESEND_API_KEY er satt opp (se README/chat for
  // instruksjoner) — inntil da svarer funksjonen med en feil som vises her.
  async function sendConfirmationEmail(booking, noteEl) {
    if (!booking.email) {
      if (noteEl) { noteEl.textContent = 'Ingen e-post oppgitt — kan ikke varsle automatisk.'; noteEl.classList.add('is-error-note'); }
      return;
    }
    if (noteEl) { noteEl.textContent = 'Sender bekreftelse …'; noteEl.classList.remove('is-error-note'); }
    try {
      const cancelBaseUrl = `${location.origin}${location.pathname.replace(/admin\.html$/, 'avbestill.html')}`;
      const { data, error } = await sb.functions.invoke('send-confirmation', {
        body: { table: 'restaurant_bookings', id: booking.id, cancelBaseUrl },
      });
      if (error || !data || !data.ok) {
        const reason = (data && data.reason) || (error && error.message) || 'ukjent feil';
        if (noteEl) { noteEl.textContent = `E-post ikke sendt (${reason}).`; noteEl.classList.add('is-error-note'); }
        return;
      }
      booking.confirmation_sent_at = new Date().toISOString();
      if (noteEl) {
        noteEl.textContent = `✓ Bekreftelse sendt ${new Date(booking.confirmation_sent_at).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' })}`;
        noteEl.classList.remove('is-error-note');
      }
    } catch (err) {
      console.error(err);
      if (noteEl) { noteEl.textContent = 'E-post ikke sendt (nettverksfeil).'; noteEl.classList.add('is-error-note'); }
    }
  }
});
