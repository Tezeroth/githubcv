(function(){
  const KEY = 'thriftScheduler_v1';
  const defaultState = {
    volunteers: [], // {id, name, color, notes}
    settings: {
      shifts: ['Morning','Afternoon'],
      darkMode: false
    },
    weeks: {
      // [weekKey]: {
      //   availability: { [volId]: { [dayIndex]: { [shiftIndex]: 'A'|'B'|'C' } } }
      //   assignments: { [dayIndex]: { [shiftIndex]: [volId, ...] } }
      // }
    }
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const seed = seedData();
        localStorage.setItem(KEY, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(raw);
    } catch(e) {
      console.error('Failed to load storage', e);
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function seedData() {
    const s = JSON.parse(JSON.stringify(defaultState));
    s.volunteers = [
      { id: id(), name: 'Alex', color: '#3aa76d', notes: 'Cashier' },
      { id: id(), name: 'Jamie', color: '#2a81cb', notes: 'Sorter' },
      { id: id(), name: 'Riley', color: '#d96570', notes: 'Floor' }
    ];
    return s;
  }

  function id() {
    return Math.random().toString(36).slice(2, 10);
  }

  function weekKeyFromDate(d) {
    const monday = getMonday(new Date(d));
    return monday.toISOString().slice(0,10);
  }

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0-6 Sun-Sat
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  }

  function ensureWeek(state, wk) {
    if (!state.weeks[wk]) {
      state.weeks[wk] = { availability: {}, assignments: {} };
    }
    return state.weeks[wk];
  }

  window.Store = {
    load, save, id,
    weekKeyFromDate, getMonday, ensureWeek
  };
})();

