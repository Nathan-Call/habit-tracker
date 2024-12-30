const { useState, useEffect, useRef } = React;

// Function to trigger the confetti
function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.6 },
  });
}

const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-clock">
      <p className={"time"}>{currentTime.toLocaleTimeString()}</p>
    </div>
  );
};

const CountdownTimer = () => {
  // Function to calculate the time left until 11:59 PM
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextReset = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    ); // Midnight
    const diff = nextReset - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, diff };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const padWithZeros = (value) => String(value).padStart(2, "0");

  // Determine if the time left is less than 60 minutes
  const isLessThanOneHour = timeLeft.diff < 60 * 60 * 1000;

  return (
    <div className="countdown-timer">
      <p className={isLessThanOneHour ? "warning time" : "time"}>
        {padWithZeros(timeLeft.hours)}:{padWithZeros(timeLeft.minutes)}:
        {padWithZeros(timeLeft.seconds)}
      </p>
    </div>
  );
};

// Utility functions for Local Storage
const loadFromStorage = (key, defaultValue) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const HabitContainer = () => {
  const [habits, setHabits] = useState(loadFromStorage("habits", []));
  const [checkboxStates, setCheckboxStates] = useState(() => {
    const data = loadFromStorage("checkboxStates", {
      states: {},
      lastUpdated: null,
    });
    const now = new Date();
    const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;

    // Reset checkbox states if lastUpdated is not from today
    if (!lastUpdated || lastUpdated.toDateString() !== now.toDateString()) {
      return {};
    }

    return data.states;
  });
  const [isEditMode, setIsEditMode] = useState(false); // Tracks if edit mode is active

  // Add a new habit
  const addHabit = (habitName) => {
    const newId = Date.now();
    const newHabits = [...habits, { id: newId, name: habitName }];
    setHabits(newHabits);
    saveToStorage("habits", newHabits);
    setCheckboxStates({
      ...checkboxStates,
      [newId]: false,
    });
  };

  // Toggle checkbox for a habit
  const toggleCheckbox = (habitId) => {
    const updatedStates = {
      ...checkboxStates,
      [habitId]: !checkboxStates[habitId],
    };
    console.log(updatedStates, habits);
    setCheckboxStates(updatedStates);
    if (Object.values(updatedStates).every((value) => value === true)) {
      triggerConfetti();
    }
    // Save updated states with a timestamp
    saveToStorage("checkboxStates", {
      states: updatedStates,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Delete a habit
  const deleteHabit = (habitId) => {
    const updatedHabits = habits.filter((habit) => habit.id !== habitId);
    setHabits(updatedHabits);
    saveToStorage("habits", updatedHabits);

    // Remove the associated checkbox state
    const updatedCheckboxStates = { ...checkboxStates };
    delete updatedCheckboxStates[habitId];
    setCheckboxStates(updatedCheckboxStates);
    saveToStorage("checkboxStates", {
      states: updatedCheckboxStates,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Schedule reset at 11:59 PM
  useEffect(() => {
    const now = new Date();
    const nextReset = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    );
    const timeUntilReset = nextReset - now;

    const resetTimeout = setTimeout(() => {
      setCheckboxStates({});
      saveToStorage("checkboxStates", {
        states: {},
        lastUpdated: new Date().toISOString(),
      });
    }, timeUntilReset);

    return () => clearTimeout(resetTimeout);
  }, []);

  return (
    <div className="habit-container">
      <form
        id="habit-form"
        onSubmit={(e) => {
          e.preventDefault();
          const habitName = e.target.elements.habitName.value.trim();
          if (habitName) {
            addHabit(habitName);
            e.target.reset();
          }
        }}
      >
        <input type="text" name="habitName" placeholder="Enter new habit" />
        <button type="submit">Add Habit</button>
      </form>

      <button onClick={() => setIsEditMode(!isEditMode)} className={"edit"}>
        {isEditMode ? "Done" : "Edit"}
      </button>

      <ul>
        {habits.map((habit) => (
          <li key={habit.id} className="habit-item">
            <div
              className="habit-card"
              onClick={() => toggleCheckbox(habit.id)} // Toggle checkbox on card click
            >
              <div className="habit-checkbox-container">
                <input
                  type="checkbox"
                  id={`habit-${habit.id}`}
                  checked={checkboxStates[habit.id] || false}
                  disabled={isEditMode} // Disable checkbox in edit mode
                  className="habit-checkbox"
                />
                <label
                  //   htmlFor={`habit-${habit.id}`}
                  className="habit-label"
                >
                  {habit.name}
                </label>
              </div>
              {isEditMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the onClick of the card
                    deleteHabit(habit.id);
                  }}
                  className="delete-btn"
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

function App() {
  ReactDOM.render(
    <React.StrictMode>
      <h1>Habit Tracker</h1>
      <div id="clock-section">
        <LiveClock /> <CountdownTimer />
      </div>

      <HabitContainer />
    </React.StrictMode>,

    document.getElementById("root")
  );
}

App();
