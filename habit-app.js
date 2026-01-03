const { useState, useEffect } = React;

/* =====================
   CONFETTI
===================== */
function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.6 },
  });
}

/* =====================
   LIVE CLOCK
===================== */
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-clock">
      <p className="time">{currentTime.toLocaleTimeString()}</p>
    </div>
  );
};

/* =====================
   COUNTDOWN TIMER
===================== */
const CountdownTimer = ({ getNextReset }) => {
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextReset = getNextReset();
    const diff = nextReset - now;

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      diff,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (v) => String(v).padStart(2, "0");
  const warning = timeLeft.diff < 60 * 60 * 1000;

  return (
    <div className="countdown-timer">
      <p className={warning ? "warning time" : "time"}>
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </p>
    </div>
  );
};

/* =====================
   STORAGE UTILS
===================== */
const load = (key, fallback) => JSON.parse(localStorage.getItem(key)) ?? fallback;

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* =====================
   DATE HELPERS
===================== */
const getNextDailyReset = () => new Date(new Date().setHours(24, 0, 0, 0));

const getNextWeeklyReset = () => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;

  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0);
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

const sameWeek = (a, b) => {
  const startOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toDateString();
  };
  return startOfWeek(a) === startOfWeek(b);
};

/* =====================
   DAILY HABITS
===================== */
const HabitContainer = ({ isEditMode }) => {
  const [habits, setHabits] = useState(load("habits", []));
  const [checkboxStates, setCheckboxStates] = useState(() => {
    const data = load("checkboxStates", { states: {}, lastUpdated: null });
    if (!data.lastUpdated) return {};
    return sameDay(new Date(data.lastUpdated), new Date()) ? data.states : {};
  });

  const addHabit = (name) => {
    const id = Date.now();
    const updated = [...habits, { id, name }];
    setHabits(updated);
    save("habits", updated);
  };

  const toggleCheckbox = (id) => {
    const updated = { ...checkboxStates, [id]: !checkboxStates[id] };
    setCheckboxStates(updated);

    if (Object.values(updated).every(Boolean)) triggerConfetti();

    save("checkboxStates", {
      states: updated,
      lastUpdated: new Date().toISOString(),
    });
  };

  const deleteHabit = (id) => {
    const updatedHabits = habits.filter((h) => h.id !== id);
    setHabits(updatedHabits);
    save("habits", updatedHabits);

    const updatedStates = { ...checkboxStates };
    delete updatedStates[id];
    setCheckboxStates(updatedStates);
    save("checkboxStates", {
      states: updatedStates,
      lastUpdated: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const reset = Object.fromEntries(habits.map((h) => [h.id, false]));
      setCheckboxStates(reset);
      save("checkboxStates", {
        states: reset,
        lastUpdated: new Date().toISOString(),
      });
    }, getNextDailyReset() - new Date());

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="habit-container">
      <div className="habit-container-header">
        <h2>Daily Habits</h2>
        <CountdownTimer getNextReset={getNextDailyReset} />
      </div>
      <form
        className="habit-form"
        onSubmit={(e) => {
          e.preventDefault();
          const name = e.target.habitName.value.trim();
          if (name) addHabit(name);
          e.target.reset();
        }}
      >
        <input name="habitName" type="text" placeholder="Enter new habit" />
        <button>Add Habit</button>
      </form>

      <ul>
        {habits.map((habit) => (
          <li key={habit.id} className="habit-item">
            <div className="habit-card" onClick={() => toggleCheckbox(habit.id)}>
              <div className="habit-checkbox-container">
                <input
                  type="checkbox"
                  checked={checkboxStates[habit.id] || false}
                  disabled={isEditMode}
                  className="habit-checkbox"
                />
                <label className="habit-label">{habit.name}</label>
              </div>

              {isEditMode && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* =====================
   WEEKLY HABITS
===================== */
const WeeklyHabitContainer = ({ isEditMode }) => {
  const [habits, setHabits] = useState(load("weeklyHabits", []));
  const [checkboxStates, setCheckboxStates] = useState(() => {
    const data = load("weeklyCheckboxStates", {
      states: {},
      lastUpdated: null,
    });
    if (!data.lastUpdated) return {};
    return sameWeek(new Date(data.lastUpdated), new Date()) ? data.states : {};
  });

  const addHabit = (name) => {
    const id = Date.now();
    const updated = [...habits, { id, name }];
    setHabits(updated);
    save("weeklyHabits", updated);
  };

  const toggleCheckbox = (id) => {
    const updated = { ...checkboxStates, [id]: !checkboxStates[id] };
    setCheckboxStates(updated);

    if (Object.values(updated).every(Boolean)) triggerConfetti();

    save("weeklyCheckboxStates", {
      states: updated,
      lastUpdated: new Date().toISOString(),
    });
  };

  const deleteHabit = (id) => {
    const updatedHabits = habits.filter((h) => h.id !== id);
    setHabits(updatedHabits);
    save("habits", updatedHabits);

    const updatedStates = { ...checkboxStates };
    delete updatedStates[id];
    setCheckboxStates(updatedStates);
    save("checkboxStates", {
      states: updatedStates,
      lastUpdated: new Date().toISOString(),
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const reset = Object.fromEntries(habits.map((h) => [h.id, false]));
      setCheckboxStates(reset);
      save("weeklyCheckboxStates", {
        states: reset,
        lastUpdated: new Date().toISOString(),
      });
    }, getNextWeeklyReset() - new Date());

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="habit-container">
      <div className="habit-container-header">
        <h2>Weekly Habits</h2>
        <CountdownTimer getNextReset={getNextWeeklyReset} />
      </div>
      <form
        className="habit-form"
        onSubmit={(e) => {
          e.preventDefault();
          const name = e.target.habitName.value.trim();
          if (name) addHabit(name);
          e.target.reset();
        }}
      >
        <input name="habitName" type="text" placeholder="Enter new habit" />
        <button>Add Habit</button>
      </form>

      <ul>
        {habits.map((habit) => (
          <li key={habit.id} className="habit-item">
            <div className="habit-card" onClick={() => toggleCheckbox(habit.id)}>
              <div className="habit-checkbox-container">
                <input
                  type="checkbox"
                  checked={checkboxStates[habit.id] || false}
                  disabled={isEditMode}
                  className="habit-checkbox"
                />
                <label className="habit-label">{habit.name}</label>
              </div>
              {isEditMode && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHabit(habit.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* =====================
   APP
===================== */
function App() {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <React.StrictMode>
      <h1>Habit Tracker</h1>
      <div id="clock-section">
        <LiveClock />
      </div>
      <button onClick={() => setIsEditMode(!isEditMode)} className="edit">
        {isEditMode ? "Done" : "Edit"}
      </button>
      <div id="core-habit-section">
        <HabitContainer isEditMode={isEditMode} />
        <WeeklyHabitContainer isEditMode={isEditMode} />
      </div>
    </React.StrictMode>
  );
}

// App();

ReactDOM.render(<App />, document.getElementById("root"));
