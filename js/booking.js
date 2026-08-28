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
    });
  }
  initDatePicker(10);

  const statusEl = document.getElementById('bf-status');
  const submitBtn = document.getElementById('bf-submit');

  const setStatus = (text, type) => {
    statusEl.textContent = text;
    statusEl.classList.remove('is-ok', 'is-error');
    if (type) statusEl.classList.add(type);
  };

  if (!window.supabaseClient) {
    setStatus('Nettbestilling er ikke aktivert ennå — ring oss gjerne i mellomtiden.', 'is-error');
    submitBtn.disabled = true;
    return;
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

    const { error } = await window.supabaseClient.from('restaurant_bookings').insert(payload);

    if (error) {
      console.error(error);
      setStatus('Noe gikk galt. Prøv igjen, eller ring oss på 67 90 22 09.', 'is-error');
      submitBtn.disabled = false;
      return;
    }

    form.reset();
    setStatus('Takk! Vi bekrefter bordet ditt på telefon eller SMS.', 'is-ok');
    submitBtn.disabled = false;
  });
});
