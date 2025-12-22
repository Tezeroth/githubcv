(function(){
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  let state = Store.load();
  // ensure new settings fields exist for older data
  if (!state.settings) state.settings = {};
  if (typeof state.settings.darkMode === 'undefined') state.settings.darkMode = false;
  let currentWeekKey = Store.weekKeyFromDate(new Date());
  initWeekPicker();
  renderTabs();
  applyTheme();
  renderAll();

  // Tab switching
  function renderTabs(){
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        btns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
        document.querySelector('#tab-'+tab).classList.add('active');
      });
    });

    // dark mode toggle wiring
    const darkBtn = document.getElementById('darkmode-btn');
    if (darkBtn) {
      updateDarkButton(darkBtn);
      darkBtn.addEventListener('click', ()=>{
        state.settings.darkMode = !state.settings.darkMode;
        applyTheme();
        Store.save(state);
        updateDarkButton(darkBtn);
      });
    }
  }

  function initWeekPicker(){
    const monday = Store.getMonday(new Date());
    document.getElementById('week-start').value = monday.toISOString().slice(0,10);
    document.getElementById('week-start').addEventListener('change', (e)=>{
      currentWeekKey = Store.weekKeyFromDate(new Date(e.target.value));
      renderAll();
    });
    document.getElementById('prev-week').addEventListener('click', ()=>{
      const d = new Date(document.getElementById('week-start').value);
      d.setDate(d.getDate()-7);
      document.getElementById('week-start').value = Store.getMonday(d).toISOString().slice(0,10);
      currentWeekKey = Store.weekKeyFromDate(d);
      renderAll();
    });
    document.getElementById('next-week').addEventListener('click', ()=>{
      const d = new Date(document.getElementById('week-start').value);
      d.setDate(d.getDate()+7);
      document.getElementById('week-start').value = Store.getMonday(d).toISOString().slice(0,10);
      currentWeekKey = Store.weekKeyFromDate(d);
      renderAll();
    });
  }

  function renderAll(){
    Store.ensureWeek(state, currentWeekKey);
    renderVolunteerPool();
    renderScheduleGrid();
    renderAvailabilityUI();
    renderVolunteerTable();
    populateAvailabilityVolunteerSelect();
    Store.save(state);
  }

  function applyTheme(){
    if (state.settings && state.settings.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  function updateDarkButton(btn){
    if (!btn) return;
    const isDark = !!state.settings.darkMode;
    btn.textContent = isDark ? '☀' : '☾';
    btn.setAttribute('aria-pressed', String(isDark));
  }

  // Auto rota + clear rota
  document.addEventListener('DOMContentLoaded', ()=>{
    const autoBtn = document.getElementById('auto-rota');
    if (autoBtn) {
      autoBtn.addEventListener('click', ()=>{
        autoFillRota();
      });
    }

    const clearBtn = document.getElementById('clear-rota');
    if (clearBtn) {
      clearBtn.addEventListener('click', ()=>{
        clearRota();
      });
    }
  });

  function countWeekAssignments(week, volId){
    let count = 0;
    const days = week.assignments || {};
    Object.keys(days).forEach(dKey=>{
      const day = days[dKey] || {};
      Object.keys(day).forEach(sKey=>{
        const list = day[sKey] || [];
        if (list.includes(volId)) count++;
      });
    });
    return count;
  }

  function autoFillRota(){
    const week = Store.ensureWeek(state, currentWeekKey);
    const shifts = state.settings.shifts;
    const MAX_PER_SHIFT = 3; // allow multiple volunteers per shift
    if (!state.volunteers.length) return;

    const unmetShifts = [];

    for (let d = 0; d < 7; d++){
      week.assignments[d] = week.assignments[d] || {};
      for (let s = 0; s < shifts.length; s++){
        week.assignments[d][s] = week.assignments[d][s] || [];
        const assigned = week.assignments[d][s];

        // keep adding until we reach capacity
        while (assigned.length < MAX_PER_SHIFT) {
          // Build candidate pools by availability, excluding already assigned
          const poolA = [];
          const poolNeutral = [];
          const poolB = [];

          state.volunteers.forEach(v=>{
            if (assigned.includes(v.id)) return;
            const av = getAvailability(v.id, d, s); // 'A','B','C', or null
            if (av === 'C') return;
            if (av === 'A') poolA.push(v);
            else if (av === 'B') poolB.push(v);
            else poolNeutral.push(v);
          });

          const pickFrom = poolA.length ? poolA : (poolNeutral.length ? poolNeutral : poolB);
          if (!pickFrom.length) {
            // no candidates left for this slot; record if completely empty
            if (assigned.length === 0) {
              unmetShifts.push({ dayIndex: d, shiftIndex: s });
            }
            break;
          }

          // balance by number of assignments in this week
          pickFrom.sort((v1, v2)=>{
            return countWeekAssignments(week, v1.id) - countWeekAssignments(week, v2.id);
          });

          const chosen = pickFrom[0];
          if (!chosen) break;
          if (!assigned.includes(chosen.id)){
            assigned.push(chosen.id);
          } else {
            break;
          }
        }
      }
    }
    Store.save(state);
    renderScheduleGrid();

    if (unmetShifts.length){
      const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const msgLines = unmetShifts.map(item=>{
        const dayName = DAYS[item.dayIndex] || `Day ${item.dayIndex+1}`;
        const shiftName = shifts[item.shiftIndex] || `Shift ${item.shiftIndex+1}`;
        return `${dayName} - ${shiftName}`;
      });
      alert('No available volunteers were found for these shifts:\n\n' + msgLines.join('\n'));
    }
  }

  function clearRota(){
    const week = Store.ensureWeek(state, currentWeekKey);
    week.assignments = {};
    Store.save(state);
    renderScheduleGrid();
  }

  // Volunteers
  function renderVolunteerPool(){
    const pool = document.getElementById('volunteer-pool');
    pool.innerHTML = '';
    const title = document.createElement('div');
    title.style.fontWeight='700';
    title.style.margin='4px 0 8px';
    title.textContent = 'Volunteers';
    pool.appendChild(title);

    state.volunteers.forEach(v=>{
      const card = document.createElement('div');
      card.className='vol-card';
      const chip = document.createElement('div');
      chip.className='vol-chip';
      chip.draggable = true;
      chip.dataset.volId = v.id;
      chip.addEventListener('dragstart', onVolDragStart);
      chip.addEventListener('touchstart', onVolTouchSelect, {passive:true});

      const dot = document.createElement('div');
      dot.className='vol-dot';
      dot.style.background = v.color || '#ccc';

      const name = document.createElement('div');
      name.className='vol-name';
      name.textContent = v.name;

      chip.appendChild(dot);
      chip.appendChild(name);

      const btn = document.createElement('button');
      btn.className='assign-btn';
      btn.textContent='Select';
      btn.addEventListener('click', ()=>selectVolunteerForTap(v.id));

      card.appendChild(chip);
      card.appendChild(btn);
      pool.appendChild(card);
    });

    if (state.volunteers.length===0){
      const empty = document.createElement('div');
      empty.style.color='var(--muted)';
      empty.textContent='No volunteers. Add some in the Volunteers tab.';
      pool.appendChild(empty);
    }
  }

  let selectedVolunteerId = null;
  function selectVolunteerForTap(id) {
    selectedVolunteerId = id;
    // highlight selected
    document.querySelectorAll('.vol-chip').forEach(el=>{
      el.style.outline = (el.dataset.volId===id) ? '2px solid var(--accent)' : 'none';
    });
  }
  function onVolTouchSelect(e){
    const id = e.currentTarget.dataset.volId;
    selectVolunteerForTap(id);
  }

  function onVolDragStart(e){
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.volId);
  }

  // Schedule grid
  function renderScheduleGrid(){
    const grid = document.getElementById('schedule-grid');
    grid.innerHTML='';
    const week = state.weeks[currentWeekKey];
    const shifts = state.settings.shifts;

    for (let d=0; d<7; d++){
      const dayCol = document.createElement('div');
      dayCol.className='day-col';

      const head = document.createElement('div');
      head.className='day-header';
      const date = new Date(Store.getMonday(new Date(document.getElementById('week-start').value)));
      date.setDate(date.getDate()+d);
      head.textContent = `${DAYS[d]} ${date.toISOString().slice(5,10)}`;
      dayCol.appendChild(head);

      for (let s=0; s<shifts.length; s++){
        const shiftBox = document.createElement('div');
        shiftBox.className='shift';

        const title = document.createElement('div');
        title.className='shift-title';
        title.textContent = shifts[s];
        shiftBox.appendChild(title);

        const dz = document.createElement('div');
        dz.className='dropzone';
        dz.dataset.dayIndex = String(d);
        dz.dataset.shiftIndex = String(s);

        dz.addEventListener('dragover', (e)=>{ e.preventDefault(); dz.classList.add('over'); });
        dz.addEventListener('dragleave', ()=>dz.classList.remove('over'));
        dz.addEventListener('drop', (e)=>{
          e.preventDefault();
          dz.classList.remove('over');
          const volId = e.dataTransfer.getData('text/plain');
          addAssignment(d, s, volId);
        });

        dz.addEventListener('click', ()=>{
          if (selectedVolunteerId) addAssignment(d, s, selectedVolunteerId);
        });

        const assigned = ((week.assignments[d] && week.assignments[d][s]) || []);
        assigned.forEach(volId=>{
          const v = state.volunteers.find(v=>v.id===volId);
          if (!v) return;
          dz.appendChild(createAssignmentChip(v, d, s));
        });

        shiftBox.appendChild(dz);
        dayCol.appendChild(shiftBox);
      }

      grid.appendChild(dayCol);
    }
  }

  function addAssignment(dayIdx, shiftIdx, volId){
    const week = state.weeks[currentWeekKey];
    week.assignments[dayIdx] = week.assignments[dayIdx] || {};
    week.assignments[dayIdx][shiftIdx] = week.assignments[dayIdx][shiftIdx] || [];
    // prevent duplicates
    if (!week.assignments[dayIdx][shiftIdx].includes(volId)){
      week.assignments[dayIdx][shiftIdx].push(volId);
    }
    Store.save(state);
    renderScheduleGrid();
  }

  function createAssignmentChip(v, dayIdx, shiftIdx){
    const chip = document.createElement('div');
    chip.className='assignment';
    const dot = document.createElement('div');
    dot.className='vol-dot';
    dot.style.background = v.color || '#ccc';
    const name = document.createElement('div');
    name.textContent = v.name;

    // availability mark
    const av = getAvailability(v.id, dayIdx, shiftIdx);
    if (av==='C') chip.classList.add('bad');
    else if (av==='B') chip.classList.add('warn');

    const remove = document.createElement('button');
    remove.className='remove';
    remove.title='Remove';
    remove.textContent='×';
    remove.addEventListener('click', ()=>{
      const week = state.weeks[currentWeekKey];
      const list = week.assignments[dayIdx][shiftIdx] || [];
      week.assignments[dayIdx][shiftIdx] = list.filter(id=>id!==v.id);
      Store.save(state);
      renderScheduleGrid();
    });

    chip.appendChild(dot);
    chip.appendChild(name);
    chip.appendChild(remove);
    return chip;
  }

  // Availability UI
  function populateAvailabilityVolunteerSelect(){
    const sel = document.getElementById('availability-volunteer-select');
    const current = sel.value;
    sel.innerHTML='';
    state.volunteers.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name;
      sel.appendChild(opt);
    });
    if (state.volunteers.length>0){
      if (current && state.volunteers.some(v=>v.id===current)) sel.value=current;
      else sel.value = state.volunteers[0].id;
    }
    sel.addEventListener('change', renderAvailabilityGrid);
  }

  function renderAvailabilityUI(){
    renderAvailabilityGrid();
  }

  function renderAvailabilityGrid(){
    const container = document.getElementById('availability-grid');
    container.innerHTML='';
    const volId = document.getElementById('availability-volunteer-select').value;
    if (!volId){
      container.innerHTML = '<div style="padding:12px;color:var(--muted)">Add volunteers to set availability.</div>';
      return;
    }
    const shifts = state.settings.shifts;

    for (let d=0; d<7; d++){
      const day = document.createElement('div');
      day.className='av-day';

      const head = document.createElement('div');
      head.className='av-head';
      const date = new Date(Store.getMonday(new Date(document.getElementById('week-start').value)));
      date.setDate(date.getDate()+d);
      head.textContent = `${DAYS[d]} ${date.toISOString().slice(5,10)}`;
      day.appendChild(head);

      const slots = document.createElement('div');
      slots.className='av-shifts';

      for (let s=0; s<shifts.length; s++){
        const row = document.createElement('div');
        row.className='av-shift';

        const label = document.createElement('span');
        label.textContent = shifts[s];
        row.appendChild(label);

        ['A','B','C'].forEach(code=>{
          const btn = document.createElement('button');
          btn.className='toggle';
          btn.textContent=code;
          const current = getAvailability(volId, d, s);
          if (current===code){
            btn.classList.add('active', code.toLowerCase());
          }
          btn.addEventListener('click', ()=>{
            setAvailability(volId, d, s, code);
            renderAvailabilityGrid();
            renderScheduleGrid(); // refresh colors
          });
          row.appendChild(btn);
        });

        slots.appendChild(row);
      }

      day.appendChild(slots);
      container.appendChild(day);
    }
  }

  function getAvailability(volId, dayIdx, shiftIdx){
    const week = Store.ensureWeek(state, currentWeekKey);
    const map = week.availability[volId] || {};
    const day = map[dayIdx] || {};
    return day[shiftIdx] || null;
  }
  function setAvailability(volId, dayIdx, shiftIdx, code){
    const week = Store.ensureWeek(state, currentWeekKey);
    week.availability[volId] = week.availability[volId] || {};
    week.availability[volId][dayIdx] = week.availability[volId][dayIdx] || {};
    week.availability[volId][dayIdx][shiftIdx] = code;
    Store.save(state);
  }

  // Volunteer management
  const form = document.getElementById('volunteer-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = document.getElementById('volunteer-id').value;
    const name = document.getElementById('volunteer-name').value.trim();
    const color = document.getElementById('volunteer-color').value;
    const notes = document.getElementById('volunteer-notes').value.trim();
    if (!name) return;

    if (id){
      const v = state.volunteers.find(v=>v.id===id);
      if (v){ v.name=name; v.color=color; v.notes=notes; }
    } else {
      state.volunteers.push({ id: Store.id(), name, color, notes });
    }
    Store.save(state);
    form.reset();
    document.getElementById('volunteer-color').value = '#3aa76d';
    document.getElementById('volunteer-id').value = '';
    renderAll();
  });
  document.getElementById('reset-volunteer').addEventListener('click', ()=>{
    form.reset();
    document.getElementById('volunteer-color').value = '#3aa76d';
    document.getElementById('volunteer-id').value = '';
  });

  function renderVolunteerTable(){
    const tbody = document.querySelector('#volunteer-table tbody');
    tbody.innerHTML='';
    state.volunteers.forEach(v=>{
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;">
        <span class="vol-dot" style="background:${v.color}"></span>${escapeHtml(v.name)}
      </span>`;
      const tdNotes = document.createElement('td');
      tdNotes.textContent = v.notes || '';
      const tdActions = document.createElement('td');
      const wrap = document.createElement('div'); wrap.className='actions';

      const edit = document.createElement('button');
      edit.textContent='Edit';
      edit.addEventListener('click', ()=>{
        document.getElementById('volunteer-id').value = v.id;
        document.getElementById('volunteer-name').value = v.name;
        document.getElementById('volunteer-color').value = v.color || '#3aa76d';
        document.getElementById('volunteer-notes').value = v.notes || '';
      });

      const del = document.createElement('button');
      del.textContent='Delete';
      del.style.color='var(--error)';
      del.addEventListener('click', ()=>{
        // remove assignments and availability for this volunteer across all weeks
        state.volunteers = state.volunteers.filter(x=>x.id!==v.id);
        Object.keys(state.weeks).forEach(wk=>{
          const w = state.weeks[wk];
          delete w.availability[v.id];
          Object.keys(w.assignments).forEach(d=>{
            const day = w.assignments[d];
            Object.keys(day).forEach(s=>{
              day[s] = (day[s]||[]).filter(id=>id!==v.id);
            });
          });
        });
        Store.save(state);
        renderAll();
      });

      wrap.appendChild(edit);
      wrap.appendChild(del);
      tdActions.appendChild(wrap);

      tr.appendChild(tdName);
      tr.appendChild(tdNotes);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  // Export / Print
  document.getElementById('export-json').addEventListener('click', ()=>{
    const out = document.getElementById('export-output');
    out.value = JSON.stringify(state, null, 2);
    out.focus(); out.select();
  });

  document.getElementById('export-csv').addEventListener('click', ()=>{
    const csv = toCSV(state, currentWeekKey);
    const out = document.getElementById('export-output');
    out.value = csv;
    out.focus(); out.select();
  });

  document.getElementById('print-rota').addEventListener('click', ()=>{
    window.print();
  });

  function toCSV(state, wk){
    const shifts = state.settings.shifts;
    const lines = [];
    lines.push(['Day','Shift','Volunteers'].join(','));
    for (let d=0; d<7; d++){
      for (let s=0; s<shifts.length; s++){
        const vols = (((state.weeks[wk]||{}).assignments||{})[d]||{})[s]||[];
        const names = vols.map(id=> (state.volunteers.find(v=>v.id===id)||{}).name || 'Unknown').join('; ');
        lines.push([DAYS[d], shifts[s], names].map(s=>escapeCsv(s)).join(','));
      }
    }
    return lines.join('\n');
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[s]);
  }
  function escapeCsv(str){
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')){
      return `"${s.replace(/"/g,'""')}"`;
    }
    return s;
  }
})();

