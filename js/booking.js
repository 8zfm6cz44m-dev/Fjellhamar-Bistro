// ============================================================
// Bordbestilling — sender skjemaet til Supabase (tabell
// "restaurant_bookings"). Samme mønster som Lørenskog Dyrebutikks
// timebestilling.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // Ekte kalendervisning for "Dato" (flatpickr) i stedet for å stole på
  // nettleserens eget <input type="date">. Viser dato på norsk
  // (dd.mm.åååå) men lagrer i ISO-format (åååå-mm-dd), som matcher
  // "booking_date"-kolonnen i Supabase.
  function initDatePicker(attemptsLeft) {
    const dateInput = document.getElementById('bf-date');
    if (!dateInput) return;
    if (!window.flatpickr) {
      if (attemptsLeft > 0) setTimeout(() => initDatePicker(attemptsLeft - 1), 100);
      return;
    }
    try {
      if (window.flatpickr.l10ns && window.flatpickr.l10ns.no) {
        window.flatpickr.localize(window.flatpickr.l10ns.no);
      }
    } catch (e) { /* fortsett uten norsk oversettelse hvis dette skulle feile */ }
    window.flatpickr(dateInput, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd.m.Y',
      minDate: 'today',
      disableMobile: true,
      // Vi har stengt på mandager — kan ikke velges som bestillingsdato.
      disable: [date => date.getDay() === 1],
    });
  }
  initDatePicker(10);

  const statusEl = document.getElementById('bf-status');
  const submitBtn = document.getElementById('bf-submit');

  // Vanlig statusmelding (ren tekst).
  const setStatus = (text, type) => {
    statusEl.innerHTML = '';
    statusEl.classList.remove('is-ok', 'is-error');
    statusEl.appendChild(document.createTextNode(text));
    if (type) statusEl.classList.add(type);
  };

  // Feilmelding med en klikkbar "ring oss"-lenke, slik at bestillingen
  // ALLTID kan fullføres på en annen måte selv om selve nettinnsendingen
  // blokkeres av f.eks. en annonseblokkering/personvern-utvidelse i
  // nettleseren (dette kan ikke løses fra sidens egen kode — nettleseren
  // nekter da å sende forespørselen i utgangspunktet).
  const setBlockedStatus = () => {
    statusEl.innerHTML = '';
    statusEl.classList.remove('is-ok');
    statusEl.classList.add('is-error');
    statusEl.appendChild(document.createTextNode(
      'Bestillingen kom ikke frem — dette skyldes ofte en annonseblokkering eller personvern-utvidelse i nettleseren. Prøv gjerne i et privat vindu, eller '
    ));
    const callLink = document.createElement('a');
    callLink.href = 'tel:67902209';
    callLink.className = 'status-call-link';
    callLink.textContent = 'ring oss på 67 90 22 09';
    statusEl.appendChild(callLink);
    statusEl.appendChild(document.createTextNode(' så ordner vi bordet med en gang.'));
  };

  if (!window.supabaseClient) {
    setBlockedStatus();
    submitBtn.disabled = true;
    return;
  }

  // Ett forsøk på å sende bestillingen. Returnerer null ved suksess,
  // ellers feilobjektet (fanger både Supabase-feil OG kastede unntak,
  // f.eks. en fetch som avbrytes av en nettleserutvidelse).
  async function trySubmit(payload) {
    try {
      const { error } = await window.supabaseClient.from('restaurant_bookings').insert(payload);
      return error || null;
    } catch (err) {
      return err;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    setStatus('Sender bestilling …', null);

    const fd = new FormData(form);
    const payload = {
      name: fd.get('name')?.toString().trim(),
      phone: fd.get('phone')?.toString().trim(),
      email: fd.get('email')?.toString().trim() || null,
      guests: fd.get('guests') ? Number(fd.get('guests')) : null,
      booking_date: fd.get('booking_date') || null,
      booking_time: fd.get('booking_time')?.toString().trim() || null,
      message: fd.get('message')?.toString().trim() || null,
    };

    if (!payload.name || !payload.phone || !payload.guests || !payload.booking_date || !payload.booking_time) {
      setStatus('Fyll ut navn, telefon, antall gjester, dato og tidspunkt.', 'is-error');
      submitBtn.disabled = false;
      return;
    }

    let error = await trySubmit(payload);

    // Stille automatisk nytt forsøk ved første feil — fanger opp korte,
    // forbigående nettverksglipp uten å plage brukeren med det.
    if (error) {
      await new Promise(r => setTimeout(r, 700));
      error = await trySubmit(payload);
    }

    if (error) {
      console.error(error);
      setBlockedStatus();
      submitBtn.disabled = false;
      return;
    }

    form.reset();
    setStatus('Takk! Vi tar kontakt på telefon for å bekrefte bordet.', 'is-ok');
    submitBtn.disabled = false;
  });
});
