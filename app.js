
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase credentials
// Use ONLY your Project URL and Publishable key.
// Never use your secret/service_role key here.

const SUPABASE_URL = "https://jlptbfifmfyuhiacmahi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_CmXNCTtrYGl_bR5NqKPWTg_saXCTo2e";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");

const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const PROTEIN_TARGET = 150;
const STORAGE_KEY = "gym-planner-v1";

const workouts = [
  {day:"Monday",short:"MON",tab:"Chest / Back",title:"Chest + Back A",focus:"Strength emphasis · Cardio finisher",cardio:"10–12 min incline treadmill",exercises:[
    ["bench","Barbell bench press","3 × 5–8"],
    ["pullups","Pull-ups","3 × 6–8"],
    ["incline","Incline dumbbell press","3 × 8–10"],
    ["row","Bent-over row","3 × 6–10"],
    ["fly","Cable fly","2 × 12–15"],
    ["pulldown","Straight-arm pulldown","2 × 12–15"]
  ]},
  {day:"Tuesday",short:"TUE",tab:"Shoulders / Arms",title:"Shoulders + Arms A",focus:"Shoulder and arm strength",cardio:"10 min cycling",exercises:[
    ["shoulder","Seated dumbbell shoulder press","3 × 6–8"],
    ["lateral","Dumbbell lateral raise","3 × 12–15"],
    ["reverse","Reverse pec deck","2 × 12–15"],
    ["ezcurl","EZ-bar curl","3 × 8–10"],
    ["closebench","Close-grip bench press","3 × 6–8"],
    ["hammer","Hammer curl","2 × 10–12"],
    ["pushdown","Rope triceps pushdown","2 × 10–12"]
  ]},
  {day:"Wednesday",short:"WED",tab:"Legs / Abs",title:"Legs A + Abs",focus:"Squat emphasis · Core",cardio:"No extra cardio",exercises:[
    ["squat","Back squat","3 × 5–8"],
    ["legpress","Leg press","3 × 8–12"],
    ["rdl","Romanian deadlift","2 × 8–10"],
    ["extension","Leg extension","2 × 12–15"],
    ["calf","Standing calf raise","3 × 10–15"],
    ["knee","Hanging knee raise","3 × 12–15"],
    ["crunch","Cable crunch","2 × 12–15"]
  ]},
  {day:"Thursday",short:"THU",tab:"Chest / Back",title:"Chest + Back B",focus:"Hypertrophy emphasis",cardio:"12–15 min incline treadmill",exercises:[
    ["inclinebar","Incline barbell bench press","3 × 8–10"],
    ["lat","Lat pulldown","3 × 8–12"],
    ["machine","Machine chest press","3 × 10–12"],
    ["supported","Chest-supported row","3 × 10–12"],
    ["pecdeck","Pec deck","2 × 12–15"],
    ["cable","Seated cable row","2 × 12"]
  ]},
  {day:"Friday",short:"FRI",tab:"Shoulders / Arms",title:"Shoulders + Arms B",focus:"Delts and arm volume",cardio:"10 min cycling",exercises:[
    ["machinepress","Machine shoulder press","3 × 8–10"],
    ["cablelat","Cable lateral raise","3 × 12–15"],
    ["rear","Rear delt cable fly","2 × 12–15"],
    ["preacher","Preacher curl","3 × 10–12"],
    ["inclinecurl","Incline dumbbell curl","2 × 10–12"],
    ["overhead","Overhead cable triceps extension","3 × 10–12"],
    ["rope","Rope triceps pushdown","2 × 12–15"]
  ]},
  {day:"Saturday",short:"SAT",tab:"Legs / Abs",title:"Legs B + Abs",focus:"Posterior chain and legs",cardio:"10 min easy walk",exercises:[
    ["rdlb","Romanian deadlift","3 × 6–10"],
    ["hack","Hack squat","3 × 8–12"],
    ["curl","Seated leg curl","3 × 10–12"],
    ["bulgarian","Bulgarian split squat","2 × 10 each leg"],
    ["hip","Hip thrust","2 × 10–12"],
    ["seatedcalf","Seated calf raise","3 × 12–15"],
    ["crunchb","Cable crunch","3 × 12–15"]
  ]},
  {day:"Sunday",short:"SUN",tab:"Recovery",title:"Recovery day",focus:"Rest and mobility",cardio:"20–30 min relaxed walk",exercises:[
    ["walk","Relaxed walk","20–30 min"],
    ["mobility","Mobility work","5–10 min"]
  ]}
];

// Application state
let selectedDay = (new Date().getDay() + 6) % 7;
let selectedWeekOffset = 0;
let saved = loadLocal();

let completed = saved.completed || {};
let checkin = saved.checkin || {};
let checkinLogs = saved.checkinLogs || {};
let proteinLogs = saved.proteinLogs || {};
let cardioLogs = saved.cardioLogs || {};
let liftLogs = saved.liftLogs || {};

let currentUser = null;
let signupMode = false;
const saveTimers = {};

// Local storage
function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    completed,
    checkin,
    checkinLogs,
    proteinLogs,
    cardioLogs,
    liftLogs
  }));
}

// Date helpers
function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function parseDate(key) {
  const [year,month,day] = key.split("-").map(Number);
  return new Date(year,month-1,day);
}

function addDays(date,amount) {
  const result = new Date(date);
  result.setDate(result.getDate()+amount);
  return result;
}

function formatDate(key) {
  return parseDate(key).toLocaleDateString("en-IN",{
    day:"numeric",month:"short",year:"numeric"
  });
}

function completionKey(day = selectedDay) {
  return `${dateKey()}-${day}`;
}

function getWeekDates(offset = 0) {
  const today = new Date();
  const monday = new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const weekday = (monday.getDay()+6)%7;

  monday.setDate(monday.getDate()-weekday-(offset*7));

  return Array.from({length:7},(_,i) => {
    return dateKey(addDays(monday,i));
  });
}

function getWeekLabel(dates) {
  return `${formatDate(dates[0])} – ${formatDate(dates[6])}`;
}

// UI helpers
function status(messageText,type = "") {
  const el = document.querySelector("#connection-status");
  el.textContent = messageText;
  el.className = `status-pill ${type}`;
}

function message(selector,text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text || "";
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// Workout tabs
function renderTabs() {
  document.querySelector("#day-tabs").innerHTML = workouts.map((w,i) =>
    `<button class="day-tab ${i===selectedDay?"active":""}" data-day="${i}">
      <strong>${w.short}</strong>
      <span>${w.tab}</span>
    </button>`
  ).join("");

  document.querySelectorAll("[data-day]").forEach(button => {
    button.addEventListener("click",() => {
      selectedDay = Number(button.dataset.day);
      renderWorkout();
    });
  });
}

// Workout rendering
function renderWorkout() {
  const workout = workouts[selectedDay];
  const key = completionKey();
  const done = completed[key] || [];

  document.querySelector("#day-label").textContent = workout.day.toUpperCase();
  document.querySelector("#workout-title").textContent = workout.title;
  document.querySelector("#workout-focus").textContent = workout.focus;
  document.querySelector("#cardio-detail").textContent = workout.cardio;

  document.querySelector("#exercise-list").innerHTML =
    workout.exercises.map(([id,name,reps]) => `
      <label class="exercise-item ${done.includes(id)?"done":""}">
        <input type="checkbox" data-exercise="${id}"
          ${done.includes(id)?"checked":""}>
        <span>
          <span class="exercise-name">${name}</span>
          <span class="exercise-meta">${reps}</span>
        </span>
        <span class="exercise-tag">
          ${done.includes(id)?"Completed":"Working sets"}
        </span>
      </label>
    `).join("");

  document.querySelectorAll("[data-exercise]").forEach(input => {
    input.addEventListener("change",() => {
      const items = new Set(completed[key] || []);

      if (input.checked) items.add(input.dataset.exercise);
      else items.delete(input.dataset.exercise);

      completed[key] = [...items];

      persistLocal();
      renderWorkout();
      scheduleSave("workout");
      renderWeeklyHistory();
    });
  });

  const percent = Math.round(done.length / workout.exercises.length * 100);

  document.querySelector("#progress-ring")
    .style.setProperty("--progress",`${percent}%`);

  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#completion-title").textContent =
    percent === 100 ? "Session complete" : "Keep building";
  document.querySelector("#completion-count").textContent =
    `${done.length} of ${workout.exercises.length} activities completed`;

  renderTabs();
  renderLiftTracker();
  renderCardio();
}


// Exercise weight and individual set tracking

function getSetEntries(record, plannedSets = 3, plannedReps = 8) {
  if (Array.isArray(record?.setEntries) && record.setEntries.length) {
    return record.setEntries.map(set => ({
      weight: set.weight ?? "",
      reps: set.reps ?? ""
    }));
  }

  // Read older records that used one shared weight and rep value.
  const count = Math.max(1, Number(record?.sets) || plannedSets);

  return Array.from({length: count}, () => ({
    weight: record?.weight ?? "",
    reps: record?.reps ?? plannedReps
  }));
}

function renderLiftTracker() {
  const container = document.querySelector("#lift-tracker");
  const todayRecords = liftLogs[dateKey()] || {};

  container.innerHTML = workouts[selectedDay].exercises.map(([id, name, prescription]) => {
    const record = todayRecords[id] || {};
    const plannedSets = Number(String(prescription || "").match(/^\d+/)?.[0]) || 3;
    const plannedReps = Number(String(prescription || "").match(/\d+/g)?.[1]) || 8;
    const entries = getSetEntries(record, plannedSets, plannedReps);

    return `
      <div class="lift-card">
        <h3>${name}</h3>
        <p class="muted">${prescription || "Individual set tracking"}</p>

        <form class="lift-form" data-lift="${id}">
          <div class="individual-sets">
            ${entries.map((set, index) => `
              <div class="lift-set-row">
                <strong>Set ${index + 1}</strong>

                <label>
                  Weight (kg)
                  <input
                    type="number"
                    name="setWeight"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value="${set.weight}"
                    required
                  >
                </label>

                <label>
                  Reps
                  <input
                    type="number"
                    name="setReps"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="8"
                    value="${set.reps}"
                    required
                  >
                </label>

                <button
                  type="button"
                  class="button button-quiet remove-set"
                  data-remove-set
                  aria-label="Remove set ${index + 1}"
                >×</button>
              </div>
            `).join("")}
          </div>

          <div class="lift-actions">
            <button type="button" class="button button-quiet" data-add-set>
              + Add Set
            </button>

            <button class="button button-primary" type="submit">
              Save Exercise
            </button>
          </div>
        </form>
      </div>
    `;
  }).join("");

  // Add or remove individual sets.
  container.querySelectorAll(".lift-form").forEach(form => {
    form.addEventListener("click", event => {
      const addButton = event.target.closest("[data-add-set]");
      const removeButton = event.target.closest("[data-remove-set]");
      const rows = form.querySelector(".individual-sets");

      if (addButton) {
        const count = rows.querySelectorAll(".lift-set-row").length;

        if (count >= 20) {
          message("#lift-message", "Maximum 20 sets allowed.");
          return;
        }

        const nextNumber = count + 1;
        const row = document.createElement("div");
        row.className = "lift-set-row";

        row.innerHTML = `
          <strong>Set ${nextNumber}</strong>

          <label>
            Weight (kg)
            <input
              type="number"
              name="setWeight"
              min="0"
              step="0.5"
              placeholder="0"
              required
            >
          </label>

          <label>
            Reps
            <input
              type="number"
              name="setReps"
              min="1"
              max="100"
              step="1"
              placeholder="8"
              required
            >
          </label>

          <button
            type="button"
            class="button button-quiet remove-set"
            data-remove-set
            aria-label="Remove set ${nextNumber}"
          >×</button>
        `;

        rows.appendChild(row);
        updateSetNumbers(rows);
      }

      if (removeButton) {
        const allRows = rows.querySelectorAll(".lift-set-row");

        if (allRows.length <= 1) {
          message("#lift-message", "An exercise must have at least one set.");
          return;
        }

        removeButton.closest(".lift-set-row").remove();
        updateSetNumbers(rows);
      }
    });

    // Save all sets separately.
    form.addEventListener("submit", event => {
      event.preventDefault();

      const id = form.dataset.lift;
      const exercise = workouts[selectedDay].exercises.find(item => item[0] === id);

      const setRows = [...form.querySelectorAll(".lift-set-row")];

      const setEntries = setRows.map(row => ({
        weight: Number(row.querySelector('[name="setWeight"]').value),
        reps: Number(row.querySelector('[name="setReps"]').value)
      }));

      const valid = setEntries.every(set =>
        Number.isFinite(set.weight) &&
        set.weight >= 0 &&
        Number.isInteger(set.reps) &&
        set.reps >= 1 &&
        set.reps <= 100
      );

      if (!valid || !setEntries.length) {
        message("#lift-message", "Please enter valid weight and reps for every set.");
        return;
      }

      const today = dateKey();

      if (!liftLogs[today]) liftLogs[today] = {};

      liftLogs[today][id] = {
        exercise_id: id,
        exercise_name: exercise[1],

        // Individual set records.
        setEntries,

        // Summary fields retained for compatibility.
        sets: setEntries.length,
        weight: setEntries[0].weight,
        reps: setEntries[0].reps,

        day: workouts[selectedDay].day,
        updated_at: new Date().toISOString()
      };

      persistLocal();
      scheduleSave("lift");

      message("#lift-message", `${exercise[1]} saved: ${setEntries.length} individual sets.`);

      renderHistory();
      renderWeeklyHistory();
    });
  });

  renderHistory();
}

function updateSetNumbers(container) {
  container.querySelectorAll(".lift-set-row").forEach((row, index) => {
    row.querySelector("strong").textContent = `Set ${index + 1}`;
    row.querySelector("[data-remove-set]")
      ?.setAttribute("aria-label", `Remove set ${index + 1}`);
  });
}

// Protein tracker
function renderProtein() {
  const grams = safeNumber(proteinLogs[dateKey()]);
  const percentage = Math.min(grams / PROTEIN_TARGET * 100,100);

  document.querySelector("#protein-total").textContent = `${grams} g`;
  document.querySelector("#protein-remaining").textContent =
    grams >= PROTEIN_TARGET
      ? "Daily target achieved!"
      : `${PROTEIN_TARGET-grams} g remaining`;

  document.querySelector("#protein-progress-fill")
    .style.width = `${percentage}%`;

  document.querySelector("#protein-input").value = grams || "";
}

document.querySelector("#protein-form").addEventListener("submit",event => {
  event.preventDefault();

  const grams = Number(document.querySelector("#protein-input").value);

  if (!Number.isFinite(grams) || grams < 0 || grams > 1000) {
    message("#protein-message","Enter a valid protein amount.");
    return;
  }

  proteinLogs[dateKey()] = grams;

  persistLocal();
  renderProtein();
  scheduleSave("protein");
  renderWeeklyHistory();

  message("#protein-message","Daily protein intake saved.");
});

// Cardio tracker
function renderCardio() {
  const workout = workouts[selectedDay];

  document.querySelector("#cardio-plan-text").textContent = workout.cardio;
  document.querySelector("#cardio-completed").checked =
    Boolean(cardioLogs[dateKey()]);
}

document.querySelector("#cardio-completed").addEventListener("change",event => {
  cardioLogs[dateKey()] = event.target.checked;

  persistLocal();
  scheduleSave("cardio");
  renderWeeklyHistory();

  message("#cardio-message",
    event.target.checked
      ? "Cardio completed. Great work!"
      : "Cardio marked as incomplete.");
});

// Strength history
function getAllLiftRecords() {
  const records = [];

  Object.entries(liftLogs).forEach(([date,exercises]) => {
    Object.values(exercises || {}).forEach(record => {
      records.push({...record,date});
    });
  });

  return records.sort((a,b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.updated_at || "").localeCompare(a.updated_at || "");
  });
}

function renderHistory() {
  const container = document.querySelector("#strength-history");
  const records = getAllLiftRecords().slice(0,15);

  if (!records.length) {
    container.innerHTML = '<p class="week-empty">No lifting records yet. Save your first exercise record above.</p>';
    return;
  }

  container.innerHTML = records.map(record => `
    <div class="history-card">
      <h3>${record.exercise_name || "Exercise"}</h3>
      <p><strong>${record.weight} kg</strong> · ${record.sets} sets × ${record.reps} reps</p>
      <p>${record.day || ""} · ${formatDate(record.date)}</p>
    </div>
  `).join("");
}

// Weekly progress history
function setupWeekSelector() {
  const selector = document.querySelector("#week-selector");

  selector.innerHTML = Array.from({length:12},(_,offset) => {
    const dates = getWeekDates(offset);
    const label = offset === 0
      ? `Current week · ${getWeekLabel(dates)}`
      : `${offset} week${offset===1?"":"s"} ago · ${getWeekLabel(dates)}`;

    return `<option value="${offset}">${label}</option>`;
  }).join("");

  selector.value = String(selectedWeekOffset);

  selector.addEventListener("change",() => {
    selectedWeekOffset = Number(selector.value);
    renderWeeklyHistory();
  });
}

function renderWeeklyHistory() {
  const dates = getWeekDates(selectedWeekOffset);
  const weekSet = new Set(dates);

  document.querySelector("#week-range").textContent = getWeekLabel(dates);

  // Workout totals: Monday to Saturday
  let completedExercises = 0;
  let plannedExercises = 0;
  let completedSessions = 0;

  for (let day = 0; day < 6; day++) {
    const workout = workouts[day];
    const done = completed[`${dates[day]}-${day}`] || [];

    plannedExercises += workout.exercises.length;
    completedExercises += workout.exercises.filter(
      exercise => done.includes(exercise[0])
    ).length;

    if (workout.exercises.length > 0 &&
        workout.exercises.every(exercise => done.includes(exercise[0]))) {
      completedSessions++;
    }
  }

  const workoutPercent = plannedExercises
    ? Math.round(completedExercises/plannedExercises*100)
    : 0;

  document.querySelector("#week-workouts").textContent =
    `${completedSessions} / 6`;

  document.querySelector("#week-workouts-detail").textContent =
    `${completedExercises} of ${plannedExercises} exercises checked`;

  document.querySelector("#week-workout-percent").textContent =
    `${workoutPercent}%`;

  // Protein totals: average across days with a saved entry
  const proteinEntries = dates
    .filter(date => Object.prototype.hasOwnProperty.call(proteinLogs,date))
    .map(date => safeNumber(proteinLogs[date]));

  const proteinAverage = proteinEntries.length
    ? Math.round(proteinEntries.reduce((sum,value) => sum+value,0)/proteinEntries.length)
    : 0;

  document.querySelector("#week-protein-average").textContent =
    `${proteinAverage} g`;

  document.querySelector("#week-protein-detail").textContent =
    proteinEntries.length
      ? `Average of ${proteinEntries.length} logged day(s) · Target 150 g`
      : "No protein entries saved this week";

  const proteinContainer = document.querySelector("#week-protein-days");

  proteinContainer.innerHTML = dates.map((date,index) => {
    const logged = Object.prototype.hasOwnProperty.call(proteinLogs,date);
    const grams = logged ? safeNumber(proteinLogs[date]) : 0;
    const width = Math.min(grams/PROTEIN_TARGET*100,100);
    const dayName = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index];

    return `
      <div class="week-day-row">
        <span>${dayName}</span>
        <div class="week-day-bar"><span style="width:${width}%"></span></div>
        <span class="week-day-value">${logged ? `${grams}g` : "—"}</span>
      </div>
    `;
  }).join("");

  // Cardio totals
  const cardioCount = dates.filter(date => cardioLogs[date] === true).length;

  document.querySelector("#week-cardio").textContent = `${cardioCount} / 7`;

  // Dated body check-ins
  const weeklyCheckins = dates
    .filter(date => checkinLogs[date] && checkinLogs[date].weight !== "" &&
      checkinLogs[date].weight !== undefined)
    .map(date => ({
      date,
      weight:safeNumber(checkinLogs[date].weight),
      waist:checkinLogs[date].waist,
      bench:checkinLogs[date].bench
    }))
    .filter(item => item.weight > 0)
    .sort((a,b) => a.date.localeCompare(b.date));

  const weightContainer = document.querySelector("#week-weight-summary");

  if (!weeklyCheckins.length) {
    weightContainer.innerHTML =
      "No dated weight check-ins recorded for this week. Save your body check-in to start tracking.";
  } else {
    const first = weeklyCheckins[0];
    const last = weeklyCheckins[weeklyCheckins.length-1];
    const difference = last.weight-first.weight;
    const changeText = difference > 0
      ? `+${difference.toFixed(1)} kg`
      : `${difference.toFixed(1)} kg`;

    weightContainer.innerHTML = `
      <p>First recorded: <strong>${first.weight.toFixed(1)} kg</strong> · ${formatDate(first.date)}</p>
      <p>Latest recorded: <strong>${last.weight.toFixed(1)} kg</strong> · ${formatDate(last.date)}</p>
      <p>Change: <span class="weight-change">${weeklyCheckins.length > 1 ? changeText : "One check-in recorded"}</span></p>
      ${last.waist ? `<p>Latest waist: <strong>${last.waist} cm</strong></p>` : ""}
      ${last.bench ? `<p>Bench press check-in: <strong>${last.bench} kg</strong></p>` : ""}
    `;
  }

  // Strength records for the selected week
  const weeklyLifts = getAllLiftRecords().filter(record => weekSet.has(record.date));
  const strengthContainer = document.querySelector("#week-strength-history");

  if (!weeklyLifts.length) {
    strengthContainer.innerHTML =
      '<p class="week-empty">No strength records saved during this week.</p>';
  } else {
    strengthContainer.innerHTML = weeklyLifts.map(record => `
      <div class="history-card">
        <h3>${record.exercise_name || "Exercise"}</h3>
        <p><strong>${record.weight} kg</strong> · ${record.sets} sets × ${record.reps} reps</p>
        <p>${record.day || ""} · ${formatDate(record.date)}</p>
      </div>
    `).join("");
  }

  const isFutureWeek = dates[0] > dateKey();
  message("#week-history-message",
    isFutureWeek ? "This week has not started yet." : "");
}

// Cloud synchronization
function scheduleSave(type) {
  if (!currentUser || !supabase) return;

  clearTimeout(saveTimers[type]);

  saveTimers[type] = setTimeout(() => {
    saveCloud(type);
  },500);
}

async function saveCloud(type) {
  if (!currentUser || !supabase) return;

  const today = dateKey();
  let payload = {};

  if (type === "workout") {
    const prefix = `${today}-`;
    const completedByDay = {};

    Object.entries(completed).forEach(([key,value]) => {
      if (key.startsWith(prefix)) {
        completedByDay[key.slice(prefix.length)] = value;
      }
    });

    payload = {completed_by_day:completedByDay};
  }

  if (type === "checkin") {
    payload = {...(checkinLogs[today] || checkin)};
  }

  if (type === "protein") {
    payload = {grams:safeNumber(proteinLogs[today])};
  }

  if (type === "cardio") {
    payload = {completed:Boolean(cardioLogs[today])};
  }

  if (type === "lift") {
    payload = {records:liftLogs[today] || {}};
  }

  const row = {
    user_id:currentUser.id,
    record_date:today,
    record_type:type,
    payload,
    updated_at:new Date().toISOString()
  };

  const {error} = await supabase
    .from("user_progress")
    .upsert(row,{
      onConflict:"user_id,record_date,record_type"
    });

  if (error) {
    console.error("Cloud save failed:",error);
    status("Cloud sync error","error");

    const target = {
      workout:"#lift-message",
      checkin:"#checkin-message",
      protein:"#protein-message",
      cardio:"#cardio-message",
      lift:"#lift-message"
    }[type];

    if (target) message(target,`Cloud save failed: ${error.message}`);
    return;
  }

  status("Cloud synced","online");
}

// Load records from Supabase
async function loadCloud() {
  if (!currentUser || !supabase) return;

  status("Syncing…");

  const {data,error} = await supabase
    .from("user_progress")
    .select("record_date,record_type,payload")
    .eq("user_id",currentUser.id)
    .order("record_date",{ascending:false})
    .limit(500);

  if (error) {
    console.error("Cloud load failed:",error);
    status("Cloud sync error","error");
    return;
  }

  for (const row of data || []) {
    const payload = row.payload || {};
    const date = row.record_date;

    if (row.record_type === "workout") {
      if (payload.completed_by_day) {
        Object.entries(payload.completed_by_day).forEach(([day,items]) => {
          const key = `${date}-${day}`;
          completed[key] = [
            ...new Set([...(completed[key] || []),...(items || [])])
          ];
        });
      } else if (payload.completed) {
        const key = `${date}-${payload.day_index}`;
        completed[key] = [
          ...new Set([...(completed[key] || []),...payload.completed])
        ];
      }
    }

    if (row.record_type === "checkin") {
      checkinLogs[date] = {...payload};
    }

    if (row.record_type === "protein") {
      proteinLogs[date] = safeNumber(payload.grams);
    }

    if (row.record_type === "cardio") {
      cardioLogs[date] = Boolean(payload.completed);
    }

    if (row.record_type === "lift") {
      liftLogs[date] = {
        ...(liftLogs[date] || {}),
        ...(payload.records || {})
      };
    }
  }

  // Keep the latest dated check-in in the form
  const checkinDates = Object.keys(checkinLogs).sort();
  if (checkinDates.length) {
    checkin = {...checkinLogs[checkinDates[checkinDates.length-1]]};
  }

  persistLocal();

  renderWorkout();
  renderProtein();
  renderCardio();
  renderHistory();
  renderWeeklyHistory();
  fillCheckin();

  status("Cloud synced","online");
}

// Weekly check-in
function fillCheckin() {
  const todayCheckin = checkinLogs[dateKey()] || checkin || {};

  document.querySelector("#weight-input").value = todayCheckin.weight || "";
  document.querySelector("#waist-input").value = todayCheckin.waist || "";
  document.querySelector("#bench-input").value = todayCheckin.bench || "";
}

// Authentication UI
function updateAuthUI() {
  document.querySelector("#auth-button").textContent =
    currentUser ? currentUser.email : "Sign in";

  document.querySelector("#sign-out-button")
    .classList.toggle("hidden",!currentUser);

  document.querySelector("#auth-heading").textContent =
    currentUser ? "Account connected" : (signupMode ? "Create account" : "Sign in to sync");

  document.querySelector("#auth-submit").textContent =
    signupMode ? "Create account" : "Sign in";

  document.querySelector("#toggle-auth-mode").textContent =
    signupMode ? "Already have an account? Sign in" : "Need an account? Create one";
}

// Session refresh
async function refreshSession() {
  if (!supabase) {
    status("Local mode");
    return;
  }

  const {data,error} = await supabase.auth.getSession();

  if (error) console.error(error);

  currentUser = data?.session?.user || null;
  updateAuthUI();

  if (currentUser) await loadCloud();
  else status("Signed out");
}

// Authentication dialog
document.querySelector("#auth-button").addEventListener("click",() => {
  updateAuthUI();
  document.querySelector("#auth-dialog").showModal();
});

document.querySelector("#close-auth").addEventListener("click",() => {
  document.querySelector("#auth-dialog").close();
});

document.querySelector("#toggle-auth-mode").addEventListener("click",() => {
  signupMode = !signupMode;
  updateAuthUI();
  message("#auth-message","");
});

// Login and signup
document.querySelector("#auth-form").addEventListener("submit",async event => {
  event.preventDefault();

  if (!supabase) {
    message("#auth-message","Check your Supabase credentials in app.js.");
    return;
  }

  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  const button = document.querySelector("#auth-submit");

  button.disabled = true;
  button.textContent = "Please wait…";

  try {
    const result = signupMode
      ? await supabase.auth.signUp({
          email,
          password,
          options:{emailRedirectTo:window.location.origin}
        })
      : await supabase.auth.signInWithPassword({email,password});

    if (result.error) {
      message("#auth-message",result.error.message);
    } else if (signupMode && !result.data.session) {
      message("#auth-message","Account created. Check your email to confirm, then sign in.");
    } else {
      currentUser = result.data.user || result.data.session?.user || null;
      message("#auth-message","Signed in successfully.");

      if (currentUser) {
        await loadCloud();
        document.querySelector("#auth-dialog").close();
      }
    }
  } catch (error) {
    message("#auth-message",error.message || "Authentication failed.");
  } finally {
    button.disabled = false;
    updateAuthUI();
  }
});

// Sign out
document.querySelector("#sign-out-button").addEventListener("click",async () => {
  if (!supabase) return;

  const {error} = await supabase.auth.signOut();

  if (error) {
    message("#auth-message",error.message);
  } else {
    currentUser = null;
    updateAuthUI();
    status("Signed out");
    message("#auth-message","You have signed out.");
  }
});

// Reset workout
document.querySelector("#reset-day").addEventListener("click",() => {
  completed[completionKey()] = [];

  persistLocal();
  renderWorkout();
  scheduleSave("workout");
  renderWeeklyHistory();
});

// Save weekly check-in
document.querySelector("#checkin-form").addEventListener("submit",event => {
  event.preventDefault();

  checkin = {
    weight:document.querySelector("#weight-input").value,
    waist:document.querySelector("#waist-input").value,
    bench:document.querySelector("#bench-input").value
  };

  checkinLogs[dateKey()] = {...checkin};

  persistLocal();
  scheduleSave("checkin");
  renderWeeklyHistory();

  message("#checkin-message",
    currentUser
      ? "Check-in saved; syncing…"
      : "Saved on this device. Sign in to sync across devices.");
});

// Listen for authentication changes
if (supabase) {
  supabase.auth.onAuthStateChange((_event,session) => {
    currentUser = session?.user || null;
    updateAuthUI();

    if (currentUser) {
      setTimeout(() => loadCloud(),0);
    } else {
      status("Signed out");
    }
  });
}

// Start application
setupWeekSelector();
renderTabs();
renderWorkout();
renderProtein();
renderCardio();
renderHistory();
renderWeeklyHistory();
fillCheckin();
updateAuthUI();
refreshSession();
