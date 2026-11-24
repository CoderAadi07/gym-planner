
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Replace these with your own Supabase credentials.
// Use the Project URL and Publishable key only.
// NEVER use your Supabase secret/service_role key here.

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

const STORAGE_KEY = "gym-planner-v1";
let selectedDay = (new Date().getDay() + 6) % 7;
let saved = loadLocal();
let completed = saved.completed || {};
let checkin = saved.checkin || {};
let currentUser = null;
let signupMode = false;
let saveTimer;

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function persistLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({completed,checkin}));
}

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function completionKey(day = selectedDay) {
  return `${dateKey()}-${day}`;
}

function status(message, type = "") {
  const el = document.querySelector("#connection-status");
  el.textContent = message;
  el.className = `status-pill ${type}`;
}

function message(selector, text) {
  document.querySelector(selector).textContent = text || "";
}

function renderTabs() {
  document.querySelector("#day-tabs").innerHTML = workouts.map((w,i) =>
    `<button class="day-tab ${i===selectedDay?"active":""}" data-day="${i}">
      <strong>${w.short}</strong><span>${w.tab}</span>
    </button>`
  ).join("");

  document.querySelectorAll("[data-day]").forEach(button => {
    button.addEventListener("click", () => {
      selectedDay = Number(button.dataset.day);
      renderWorkout();
    });
  });
}

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
        <input type="checkbox" data-exercise="${id}" ${done.includes(id)?"checked":""}>
        <span>
          <span class="exercise-name">${name}</span>
          <span class="exercise-meta">${reps}</span>
        </span>
        <span class="exercise-tag">${done.includes(id)?"Completed":"Working sets"}</span>
      </label>
    `).join("");

  document.querySelectorAll("[data-exercise]").forEach(input => {
    input.addEventListener("change", () => {
      const items = new Set(completed[key] || []);
      if (input.checked) items.add(input.dataset.exercise);
      else items.delete(input.dataset.exercise);
      completed[key] = [...items];
      persistLocal();
      renderWorkout();
      scheduleSave("workout");
    });
  });

  const percent = Math.round(done.length / workout.exercises.length * 100);
  document.querySelector("#progress-ring").style.setProperty("--progress",`${percent}%`);
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#completion-title").textContent =
    percent === 100 ? "Session complete" : "Keep building";
  document.querySelector("#completion-count").textContent =
    `${done.length} of ${workout.exercises.length} activities completed`;

  renderTabs();
}

function scheduleSave(type) {
  if (!currentUser || !supabase) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveCloud(type),500);
}

async function saveCloud(type) {
  if (!currentUser || !supabase) return;

  const payload = type === "workout"
    ? {day_index:selectedDay,completed:completed[completionKey()] || []}
    : {...checkin};

  const row = {
    user_id:currentUser.id,
    record_date:dateKey(),
    record_type:type,
    payload,
    updated_at:new Date().toISOString()
  };

  const {error} = await supabase
    .from("user_progress")
    .upsert(row,{onConflict:"user_id,record_date,record_type"});

  if (error) {
    console.error("Cloud save failed:",error);
    status("Cloud sync error","error");
    message("#checkin-message",error.message);
  } else {
    status("Cloud synced","online");
    message("#checkin-message","Progress saved to your Supabase account.");
  }
}

async function loadCloud() {
  if (!currentUser || !supabase) return;

  status("Syncing…");
  const {data,error} = await supabase
    .from("user_progress")
    .select("record_date,record_type,payload")
    .eq("user_id",currentUser.id)
    .order("record_date",{ascending:false})
    .limit(100);

  if (error) {
    console.error("Cloud load failed:",error);
    status("Cloud sync error","error");
    return;
  }

  for (const row of data || []) {
    if (row.record_type === "workout" && row.payload?.completed) {
      const key = `${row.record_date}-${row.payload.day_index}`;
      completed[key] = [...new Set([
        ...(completed[key] || []),
        ...row.payload.completed
      ])];
    }
    if (row.record_type === "checkin") {
      checkin = {...checkin,...row.payload};
    }
  }

  persistLocal();
  renderWorkout();
  fillCheckin();
  status("Cloud synced","online");
}

function fillCheckin() {
  document.querySelector("#weight-input").value = checkin.weight || "";
  document.querySelector("#waist-input").value = checkin.waist || "";
  document.querySelector("#bench-input").value = checkin.bench || "";
}

function updateAuthUI() {
  document.querySelector("#auth-button").textContent =
    currentUser ? currentUser.email : "Sign in";
  document.querySelector("#sign-out-button").classList.toggle("hidden",!currentUser);
  document.querySelector("#auth-heading").textContent =
    currentUser ? "Account connected" : (signupMode ? "Create account" : "Sign in to sync");
  document.querySelector("#auth-submit").textContent =
    signupMode ? "Create account" : "Sign in";
  document.querySelector("#toggle-auth-mode").textContent =
    signupMode ? "Already have an account? Sign in" : "Need an account? Create one";
}

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

document.querySelector("#auth-button").addEventListener("click",() => {
  updateAuthUI();
  document.querySelector("#auth-dialog").showModal();
});

document.querySelector("#toggle-auth-mode").addEventListener("click",() => {
  signupMode = !signupMode;
  updateAuthUI();
  message("#auth-message","");
});

document.querySelector("#auth-form").addEventListener("submit",async event => {
  event.preventDefault();

  if (!supabase) {
    message("#auth-message","Add your Supabase credentials in app.js first.");
    return;
  }

  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  const button = document.querySelector("#auth-submit");

  button.disabled = true;
  button.textContent = "Please wait…";

  const result = signupMode
    ? await supabase.auth.signUp({
        email,
        password,
        options:{emailRedirectTo:window.location.origin}
      })
    : await supabase.auth.signInWithPassword({email,password});

  button.disabled = false;
  updateAuthUI();

  if (result.error) {
    message("#auth-message",result.error.message);
  } else if (signupMode && !result.data.session) {
    message("#auth-message","Account created. Check your email to confirm, then sign in.");
  } else {
    currentUser = result.data.user || result.data.session?.user || null;
    message("#auth-message","Signed in successfully.");
    if (currentUser) await loadCloud();
  }
});

document.querySelector("#sign-out-button").addEventListener("click",async () => {
  if (!supabase) return;
  const {error} = await supabase.auth.signOut();

  if (error) message("#auth-message",error.message);
  else {
    currentUser = null;
    updateAuthUI();
    status("Signed out");
    message("#auth-message","You have signed out.");
  }
});

document.querySelector("#reset-day").addEventListener("click",() => {
  completed[completionKey()] = [];
  persistLocal();
  renderWorkout();
  scheduleSave("workout");
});

document.querySelector("#checkin-form").addEventListener("submit",event => {
  event.preventDefault();

  checkin = {
    weight:document.querySelector("#weight-input").value,
    waist:document.querySelector("#waist-input").value,
    bench:document.querySelector("#bench-input").value
  };

  persistLocal();
  scheduleSave("checkin");
  message("#checkin-message",
    currentUser ? "Check-in saved; syncing…" : "Saved on this device. Sign in to sync across devices.");
});

if (supabase) {
  supabase.auth.onAuthStateChange((_event,session) => {
    currentUser = session?.user || null;
    updateAuthUI();
    if (currentUser) setTimeout(loadCloud,0);
    else status("Signed out");
  });
}

renderTabs();
renderWorkout();
fillCheckin();
updateAuthUI();
refreshSession();
