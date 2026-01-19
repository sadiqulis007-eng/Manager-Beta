//====date handel===//
  function startOfDay(d){
  d.setHours(0,0,0,0);
  return d.getTime();
}

function isInRange(dateStr, filter){
  let time = new Date(dateStr).getTime();
  let now = new Date();

  let today = startOfDay(new Date());
  let oneDay = 86400000;

  let thisWeekStart = startOfDay(new Date(now - now.getDay()*oneDay));
  let lastWeekStart = thisWeekStart - 7*oneDay;
  let lastWeekEnd = thisWeekStart - 1;

  let thisMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  let lastMonthStart = startOfDay(new Date(now.getFullYear(), now.getMonth()-1, 1));
  let lastMonthEnd = thisMonthStart - 1;

  switch(filter){
    case "today": return time >= today;
    case "thisWeek": return time >= thisWeekStart;
    case "lastWeek": return time >= lastWeekStart && time <= lastWeekEnd;
    case "thisMonth": return time >= thisMonthStart;
    case "lastMonth": return time >= lastMonthStart && time <= lastMonthEnd;
    default: return true;
  }
}

/* ===== UNIVERSAL CONFIRM ===== */
let confirmCallback = null;
function showConfirm(message, action){
  document.getElementById("confirmText").textContent = message;
  confirmCallback = action;
  document.getElementById("confirmPopup").style.display = "flex";
}
document.getElementById("confirmYes").onclick = function(){
  if(confirmCallback) confirmCallback();
  document.getElementById("confirmPopup").style.display = "none";
  confirmCallback = null;
};
document.getElementById("confirmNo").onclick = function(){
  document.getElementById("confirmPopup").style.display = "none";
  confirmCallback = null;
};

/* ===== MENU + TABS ===== */
const tabs = document.querySelectorAll(".tab-btn");
const screens = {
  money: document.getElementById("screen-money"),
  todo: document.getElementById("screen-todo"),
  notes: document.getElementById("screen-notes")
};
function showScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  if(screens[name]) screens[name].classList.add("active");
}
tabs.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");

    showScreen(btn.dataset.target);

    if(btn.dataset.target === "notes"){
  if(localStorage.getItem("notesPIN")){
    if(window.triggerNotesUnlock) window.triggerNotesUnlock();
  }
}

  });
});

/* ====== SHARED APP HISTORY HELPER ===== */
window.addAppHistory = function(entry){
  let h = JSON.parse(localStorage.getItem('appHistory') || '[]');
  h.unshift(entry);
  localStorage.setItem('appHistory', JSON.stringify(h));
};

/* ===== MONEY MANAGER LOGIC ===== */
(function(){
  const addAppHistory = window.addAppHistory;

  let balance = parseFloat(localStorage.getItem('balance') || '0');
  let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

  const balanceEl = document.getElementById('balance');
  const fab = document.getElementById('fab');
  const optionsMenu = document.getElementById('optionsMenu');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const amountInput = document.getElementById('amountInput');
  const reasonInput = document.getElementById('reasonInput');
  const submitBtn = document.getElementById('submitBtn');
  const closeBtn = document.getElementById('closeBtn');
  const historyList = document.getElementById('historyList');

  let currentAction = 'deposit';
  balanceEl.textContent = balance;

  function renderHistory(){
    historyList.innerHTML = '<h3>Transaction History</h3>';
    if(transactions.length===0){
      historyList.innerHTML += '<p>No transactions yet.</p>';
      return;
    }
    transactions.forEach((tx,index)=>{
      const div=document.createElement('div');
      div.classList.add('transaction');
      div.innerHTML = `
        <span><strong>${tx.type}</strong> - Tk ${tx.amount}</span>
        <span>Reason: ${tx.reason || '-'}</span>
        <span>Date: ${tx.date}</span>
      `;
      const delBtn=document.createElement('button');
      delBtn.textContent='Delete';
      delBtn.classList.add('delete-btn');
      delBtn.addEventListener('click', ()=>{
        showConfirm(`Delete this ${tx.type}: Tk ${tx.amount}?`, () => {
          addAppHistory(`Deleted transaction: ${tx.type} Tk ${tx.amount} — ${tx.date}`);
          transactions.splice(index,1);
          localStorage.setItem('transactions', JSON.stringify(transactions));
          renderHistory();
        });
      });
      div.appendChild(delBtn);
      historyList.appendChild(div);
    });
  }
  renderHistory();

  fab.addEventListener('click', ()=>{
    optionsMenu.style.display =
      optionsMenu.style.display==='flex' ? 'none' : 'flex';
  });

  document.getElementById('depositBtn').addEventListener('click', ()=>{
    currentAction = 'deposit';
    modalTitle.textContent = 'Deposit Money';
    reasonInput.style.display = 'none';
    amountInput.value='';
    modal.style.display='flex';
    optionsMenu.style.display='none';
  });

  document.getElementById('withdrawBtn').addEventListener('click', ()=>{
    currentAction = 'withdraw';
    modalTitle.textContent = 'Withdraw Money';
    reasonInput.style.display = 'block';
    amountInput.value='';
    modal.style.display='flex';
    optionsMenu.style.display='none';
  });

  closeBtn.addEventListener('click', ()=> modal.style.display='none');

  submitBtn.addEventListener('click', ()=>{
    const amount = parseFloat(amountInput.value);
    const reason = reasonInput.value.trim();
    if(isNaN(amount) || amount <= 0){
      alert("Enter valid amount");
      return;
    }
    const dateStr = new Date().toLocaleString();

    if(currentAction === 'deposit'){
      balance += amount;
      transactions.unshift({type:'Deposit', amount, reason:'', date:dateStr});
      addAppHistory(`Deposit: Tk ${amount} — ${dateStr}`);
    } else {
      if(amount > balance){ alert("Insufficient balance"); return; }
      if(reason === ''){ alert("Provide reason"); return; }
      balance -= amount;
      transactions.unshift({type:'Withdraw', amount, reason, date:dateStr});
      addAppHistory(`Withdraw: Tk ${amount} — Reason: ${reason} — ${dateStr}`);
    }

    balanceEl.textContent = balance;
    localStorage.setItem('balance', balance);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderHistory();
    modal.style.display='none';
  });

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(!confirm("Balance will be set to 0.\nHistory will stay.\nContinue?")) return;
    const cleared = balance;
    const dateStr = new Date().toLocaleString();
    transactions.unshift({
      type: "Reset",
      amount: cleared,
      reason: "Balance Cleared",
      date: dateStr
    });
    addAppHistory(`Reset: Cleared Tk ${cleared} — ${dateStr}`);
    balance = 0;
    localStorage.setItem('balance', balance);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    balanceEl.textContent = balance;
    renderHistory();
    optionsMenu.style.display='none';
  });

 })();

 /* ===== TODO LIST (FINAL – MANUAL TASKS ONLY | CLEAN) ===== */
(function(){

  const addAppHistory = window.addAppHistory;
  const todoList = document.getElementById('todoList');
  const ONE_DAY = 86400000;

  /* ===== TIME HELPERS ===== */
  function nowStr(){
    return new Date().toLocaleString("en-GB",{
      day:"2-digit",
      month:"short",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    });
  }

  function formatTaskTime(t){
    return t ? ` ${t}` : "";
  }

  function to12Hour(time24){
    if(!time24) return "";
    let [h, m] = time24.split(":").map(Number);
    let ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2,"0")} ${ampm}`;
  }

  /* ================= SAVE TASKS ================= */
  function saveTasks(){
    const tasks = [];
    document.querySelectorAll('#todoList li').forEach(li=>{
      tasks.push({
        text: li.querySelector('.task-text').textContent,
        created: Number(li.dataset.created),
        time: li.dataset.time || null
      });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  /* ================= ADD TASK TO UI ================= */
  function addTaskToUI(text, createdAt, meta = {}){
    const li = document.createElement('li');
    li.dataset.created = createdAt;
    li.dataset.time = meta.time || "";

    /* TEXT */
    const span = document.createElement('span');
    span.className = "task-text";
    span.textContent = text;
    li.appendChild(span);

    /* FOOTER */
    const footer = document.createElement("div");
    footer.className = "task-footer";

    const dateSpan = document.createElement("span");
    dateSpan.className = "task-date";

    if(Date.now() - createdAt >= ONE_DAY){
      li.classList.add("task-old");
      dateSpan.textContent =
        new Date(createdAt).toLocaleDateString("en-GB",{
          day:"2-digit", month:"short", year:"numeric"
        });
    }else{
      dateSpan.textContent = to12Hour(meta.time);
    }

    footer.appendChild(dateSpan);

    /* BUTTONS */
    const btnGroup = document.createElement('div');
    btnGroup.className = 'button-group';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'done-btn';
    doneBtn.textContent = 'Done';
    doneBtn.onclick = ()=>{
      addAppHistory(
        `Task completed: ${text}${formatTaskTime(li.dataset.time)} — ${nowStr()}`
      );
      li.remove();
      saveTasks();
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = ()=>{
      showConfirm("Delete this task?", ()=>{
        addAppHistory(
          `Task deleted: ${text}${formatTaskTime(li.dataset.time)} — ${nowStr()}`
        );
        li.remove();
        saveTasks();
      });
    };

    btnGroup.append(doneBtn, delBtn);
    footer.appendChild(btnGroup);
    li.appendChild(footer);
    todoList.appendChild(li);
  }

  /* ================= ADD TASK ================= */
  function addTask(text, meta){
    if(!text) return;

    if(todoList.children.length >= 35){
      alert("Maximum 35 tasks allowed!");
      return;
    }

    addTaskToUI(text, Date.now(), meta);
    saveTasks();
    sortTasksByNearestTime();

    addAppHistory(
      `Task added: ${text}${formatTaskTime(meta.time)} — ${nowStr()}`
    );
  }

  /* ================= SORT ================= */
  function sortTasksByNearestTime(){
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();

    const items = Array.from(todoList.children);

    items.sort((a, b) => {

      if(a.classList.contains("task-blink") && !b.classList.contains("task-blink")) return -1;
      if(!a.classList.contains("task-blink") && b.classList.contains("task-blink")) return 1;

      if(a.classList.contains("task-old") && !b.classList.contains("task-old")) return 1;
      if(!a.classList.contains("task-old") && b.classList.contains("task-old")) return -1;

      const ta = a.dataset.time;
      const tb = b.dataset.time;

      if(ta && tb){
        const [ah, am] = ta.split(":").map(Number);
        const [bh, bm] = tb.split(":").map(Number);
        return (ah*60+am-nowMin) - (bh*60+bm-nowMin);
      }

      if(ta && !tb) return -1;
      if(!ta && tb) return 1;

      return 0;
    });

    items.forEach(li => todoList.appendChild(li));
  }

  /* ================= LOAD ================= */
  function loadTasks(){
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach(t =>
      addTaskToUI(t.text, t.created, { time: t.time })
    );
    sortTasksByNearestTime();
  }

  /* ================= TIME BLINK (5 MIN) ================= */
  (function(){
    const BLINK_DURATION = 5 * 60 * 1000;

    function startOfToday(){
      const d = new Date();
      d.setHours(0,0,0,0);
      return d.getTime();
    }

    function getTodayTimeMs(timeStr){
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    }

    function run(){
      const now = Date.now();
      const todayStart = startOfToday();

      document.querySelectorAll("#todoList li").forEach(li=>{
        if(!li.dataset.time) return;

        if(Number(li.dataset.created) < todayStart){
          li.classList.remove("task-blink");
          return;
        }

        const start = getTodayTimeMs(li.dataset.time);
        const end = start + BLINK_DURATION;

        li.classList.toggle("task-blink", now >= start && now < end);
      });

      sortTasksByNearestTime();
    }

    run();
    setInterval(run, 1000);
  })();

  /* ================= MODAL ================= */
  const modal = document.getElementById("taskModal");
  const taskInput = document.getElementById("taskInput");
  const taskTime = document.getElementById("taskTime");

  document.getElementById("plusBtn").onclick = ()=>{
    taskInput.value="";
    taskTime.value="";
    modal.style.display="flex";
    taskInput.focus();
  };

  document.getElementById("addTaskBtn").onclick = ()=>{
    const t = taskInput.value.trim();
    if(!t) return;

    addTask(t,{ time: taskTime.value || null });
    modal.style.display="none";
  };

  document.getElementById("cancelTaskBtn").onclick =
    ()=> modal.style.display="none";

  modal.onclick = e=>{
    if(e.target === modal) modal.style.display="none";
  };

  /* ================= INIT ================= */
  loadTasks();
  setInterval(sortTasksByNearestTime,60000);

})();

 /* ===== NOTES APP WITH PIN + TIME (FINAL + TITLE + SAME POPUP) ===== */
 (function(){

  /* ===== UNLOCK TRIGGER ===== */
  window.triggerNotesUnlock = function(){
    if(pinHash && !unlocked){
      openPin("unlock");
    }
  };

  /* ===== DATA ===== */
  let notes = JSON.parse(localStorage.getItem("notes") || "[]");
  let pinHash = localStorage.getItem("notesPIN");
  let unlocked = pinHash ? false : true;

  let editNoteIndex = null; 

  /* ===== ELEMENTS ===== */
  const list = document.getElementById("notesList");
  const addBtn = document.getElementById("addNoteBtn");
  const plusMenu = document.getElementById("notesPlusMenu");

  const optAdd = document.getElementById("optAddNote");
  const optSet = document.getElementById("optSetPin");
  const optChange = document.getElementById("optChangePin");

  const notesModal = document.getElementById("notesModal");
  const modalTitle = document.getElementById("notesModalTitle");
  const noteTitleInput = document.getElementById("noteTitleInput");
  const noteInput = document.getElementById("noteInput");

  const pinModal = document.getElementById("pinModal");
  const pinTitle = document.getElementById("pinTitle");
  const pinOld = document.getElementById("pinOld");
  const pinNew = document.getElementById("pinNew");
  const pinConfirm = document.getElementById("pinConfirm");
  const pinError = document.getElementById("pinError");
  const pinDeleteBtn = document.getElementById("pinDeleteBtn");

  let pinMode = "";

  /* ===== HELPERS ===== */
  function hash(p){ return btoa(p); }
  function isValidPin(p){ return /^\d{6}$/.test(p); }

  function saveNotes(){
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  function formatTime(ts, edited){
    return (edited ? "Edited: " : "Added: ") +
      new Date(ts).toLocaleString("en-GB",{
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit"
      });
  }

  /* ===== RENDER NOTES ===== */
  function renderNotes(){
    list.innerHTML = "";

    // 🔒 LOCKED
    if(pinHash && !unlocked){
      list.innerHTML =
        "<p style='text-align:center;color:#666'>🔒 Notes Locked</p>";
      addBtn.style.display = "none";
      plusMenu.style.display = "none";
      return;
    }

    // 🔓 UNLOCKED
    addBtn.style.display = "flex";

    notes.forEach((n, i) => {

      let li = document.createElement("li");
      li.className = "note-card";

      /* TITLE */
      let title = document.createElement("div");
      title.className = "note-title";
      title.textContent = n.title;
      li.appendChild(title);

      /* NOTE TEXT */
      let text = document.createElement("span");
      text.className = "note-text";
      text.textContent = n.text;
      li.appendChild(text);

      /* FOOTER */
      let footer = document.createElement("div");
      footer.className = "note-footer";

      let dateSpan = document.createElement("span");
      dateSpan.className = "note-date";
      dateSpan.textContent =
        formatTime(n.edited || n.created, !!n.edited);
      footer.appendChild(dateSpan);

      let btnWrap = document.createElement("div");
      btnWrap.className = "note-buttons";

      /* EDIT */
      let edit = document.createElement("button");
      edit.textContent = "Edit";
      edit.className = "done-btn";
      edit.onclick = () => {
        editNoteIndex = i;
        modalTitle.textContent = "Edit Note";
        noteTitleInput.value = n.title;
        noteInput.value = n.text;
        notesModal.style.display = "flex";
        noteTitleInput.focus();
      };

      /* DELETE */
      let del = document.createElement("button");
      del.textContent = "Delete";
      del.className = "delete-btn";
      del.onclick = () => {
        showConfirm("Delete this note?", () => {
          notes.splice(i,1);
          saveNotes();
          renderNotes();
        });
      };

      btnWrap.append(edit, del);
      footer.appendChild(btnWrap);

      li.appendChild(footer);
      list.appendChild(li);
    });
  }

  /* ===== PIN MENU ===== */
  function updateMenu(){
    optSet.style.display = pinHash ? "none" : "block";
    optChange.style.display = pinHash ? "block" : "none";
  }

  function openPin(mode){
    pinMode = mode;
    pinError.textContent = "";
    pinOld.value = pinNew.value = pinConfirm.value = "";

    pinOld.style.display = "block";
    pinNew.style.display = "none";
    pinConfirm.style.display = "none";
    pinDeleteBtn.style.display = "none";

    if(mode === "unlock"){
      pinTitle.textContent = "Unlock Notes";
      pinOld.placeholder = "Enter PIN";
    }

    if(mode === "set"){
      pinTitle.textContent = "Set 6 Digit PIN";
      pinOld.style.display = "none";
      pinNew.style.display = "block";
      pinConfirm.style.display = "block";
    }

    if(mode === "change"){
      pinTitle.textContent = "Change PIN";
      pinNew.style.display = "block";
      pinConfirm.style.display = "block";
      pinDeleteBtn.style.display = "block";
    }

    pinModal.style.display = "flex";
  }

  /* ===== EVENTS ===== */

  /* PLUS BUTTON */
  addBtn.onclick = () => {
    if(pinHash && !unlocked){
      openPin("unlock");
      return;
    }
    plusMenu.style.display =
      plusMenu.style.display === "flex" ? "none" : "flex";
    updateMenu();
  };

  /* ADD NOTE */
  optAdd.onclick = () => {
    plusMenu.style.display = "none";
    if(pinHash && !unlocked){
      openPin("unlock");
      return;
    }
    editNoteIndex = null;
    modalTitle.textContent = "Add Note";
    noteTitleInput.value = "";
    noteInput.value = "";
    notesModal.style.display = "flex";
    noteTitleInput.focus();
  };

  optSet.onclick = () => {
    plusMenu.style.display = "none";
    openPin("set");
  };

  optChange.onclick = () => {
    plusMenu.style.display = "none";
    openPin("change");
  };

  /* SAVE (ADD / EDIT) */
  document.getElementById("confirmAddNote").onclick = () => {
    let title = noteTitleInput.value.trim();
    let text  = noteInput.value.trim();
    if(!title || !text) return;

    if(editNoteIndex !== null){
      notes[editNoteIndex].title = title;
      notes[editNoteIndex].text = text;
      notes[editNoteIndex].edited = Date.now();
    } else {
      notes.unshift({
        title,
        text,
        created: Date.now(),
        edited: null
      });
    }

    saveNotes();
    renderNotes();
    notesModal.style.display = "none";
    editNoteIndex = null;
  };

  document.getElementById("cancelAddNote").onclick = () => {
    notesModal.style.display = "none";
    editNoteIndex = null;
  };

  /* PIN OK */
  document.getElementById("pinOk").onclick = () => {

    if(pinMode !== "set" && hash(pinOld.value) !== pinHash){
      pinError.textContent = "Wrong PIN";
      return;
    }

    if(pinMode !== "unlock"){
      if(!isValidPin(pinNew.value))
        return pinError.textContent = "PIN must be exactly 6 digits";
      if(pinNew.value !== pinConfirm.value)
        return pinError.textContent = "PIN mismatch";
    }

    if(pinMode === "unlock"){
      unlocked = true;
      pinModal.style.display = "none";
      renderNotes();
      return;
    }

    pinHash = hash(pinNew.value);
    localStorage.setItem("notesPIN", pinHash);
    unlocked = false;
    pinModal.style.display = "none";
    renderNotes();
  };

  pinDeleteBtn.onclick = () => {
    if(hash(pinOld.value) !== pinHash)
      return pinError.textContent = "Wrong PIN";

    localStorage.removeItem("notesPIN");
    pinHash = null;
    unlocked = true;
    pinModal.style.display = "none";
    renderNotes();
  };

  document.getElementById("pinCancel").onclick =
    () => pinModal.style.display = "none";

  /* ===== INIT ===== */
  renderNotes();

})();

// 🔒 CHECK IF ANY MODAL / POPUP IS OPEN
function isAnyModalOpen(){
  return (
    document.getElementById("modal")?.style.display === "flex" ||        
    document.getElementById("taskModal")?.style.display === "flex" ||   
    document.getElementById("notesModal")?.style.display === "flex" ||  
    document.getElementById("pinModal")?.style.display === "flex" ||    
    document.getElementById("confirmPopup")?.style.display === "flex"  
  );
}
/* ===== INSTAGRAM STYLE SWIPE (TOUCH + MOUSE | FINAL) ===== */
(function(){

  const contentArea = document.querySelector(".content-area");
  const swipeScreens = ["money","todo","notes"];

  const THRESHOLD = 70;     
  const DRAG_LIMIT = 1;   

  let activeScreen = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let dragging = false;
  let verticalCancel = false;

  /* ===== BLOCK INTERACTIVE ELEMENTS ===== */
  function isSwipeBlocked(target){
    return !!target.closest(
      "button,a,input,textarea,select,label,img,svg," +
       ".fab,.money-box,button,a,input,textarea,select,label,img,svg,[role='button'],.no-swipe"
    );
  }

  /* ===== START DRAG ===== */
  function startDrag(x, y, target){
    if(isAnyModalOpen()) return;
    if(isSwipeBlocked(target)) return;

    activeScreen = document.querySelector(".screen.active");
    if(!activeScreen) return;

    startX = x;
    startY = y;
    currentX = x;
    dragging = true;
    verticalCancel = false;

    activeScreen.classList.add("dragging");
  }

  /* ===== MOVE DRAG ===== */
  function moveDrag(x, y){
    if(!dragging || !activeScreen) return;

    const dx = x - startX;
    const dy = y - startY;

    // vertical scroll → cancel swipe
    if(Math.abs(dy) > Math.abs(dx)){
      verticalCancel = true;
      cancelDrag();
      return;
    }

    currentX = x;
    activeScreen.style.transform =
      `translateX(${dx / DRAG_LIMIT}px)`;
  }

  /* ===== END DRAG ===== */
  function endDrag(){
    if(!dragging || !activeScreen) return;

    const dx = currentX - startX;
    activeScreen.classList.remove("dragging");

    if(!verticalCancel && Math.abs(dx) > THRESHOLD){
      commitSwipe(dx);
    }else{
      // snap back
      activeScreen.style.transition = "transform .25s ease";
      activeScreen.style.transform = "translateX(0)";
      setTimeout(()=>{
        if(activeScreen){
          activeScreen.style.transition = "";
        }
      },250);
    }

    dragging = false;
    activeScreen = null;
  }

  function cancelDrag(){
    if(!activeScreen) return;
    activeScreen.classList.remove("dragging");
    activeScreen.style.transition = "transform .2s ease";
    activeScreen.style.transform = "translateX(0)";
    setTimeout(()=>{
      if(activeScreen){
        activeScreen.style.transition = "";
      }
    },200);
    dragging = false;
    activeScreen = null;
  }

  /* ===== COMMIT SWIPE ===== */
  function commitSwipe(dx){
  const activeBtn = document.querySelector(".tab-btn.active");
  if(!activeBtn || !activeScreen) return;

  const current = activeBtn.dataset.target;
  const index = swipeScreens.indexOf(current);

  // 👉 swipe: left → right
  if(dx > 0){
    if(index > 0){
      instaSwitch(swipeScreens[index - 1], 100);
    }else{
      snapBack(); // Money → no left screen
    }
    return;
  }

  // 👉 swipe: right → left
  if(dx < 0){
    if(index < swipeScreens.length - 1){
      instaSwitch(swipeScreens[index + 1], -100);
    }else{
      snapBack(); // Notes → no right screen
    }
  }
}
function snapBack(){
  if(!activeScreen) return;

  activeScreen.style.transition =
    "transform .25s cubic-bezier(.25,.8,.25,1)";
  activeScreen.style.transform = "translateX(0)";

  setTimeout(()=>{
    if(activeScreen){
      activeScreen.style.transition = "";
    }
  },250);
}

  /* ===== INSTAGRAM-LIKE SWITCH ===== */
  function instaSwitch(name, dir){
    const currentScreen = document.querySelector(".screen.active");
    const nextScreen = document.getElementById("screen-" + name);
    if(!currentScreen || !nextScreen) return;

    document.querySelectorAll(".tab-btn").forEach(b=>{
      b.classList.toggle("active", b.dataset.target === name);
    });

    nextScreen.classList.add("active");
    nextScreen.style.transform = `translateX(${-dir}%)`;

    requestAnimationFrame(()=>{
      currentScreen.style.transition = "transform .28s ease";
      nextScreen.style.transition = "transform .28s ease";
      currentScreen.style.transform = `translateX(${dir}%)`;
      nextScreen.style.transform = "translateX(0)";
    });

    setTimeout(()=>{
      currentScreen.classList.remove("active");
      currentScreen.style.transform = "";
      currentScreen.style.transition = "";
      nextScreen.style.transition = "";
    },280);

    // notes unlock on swipe
    if(name === "notes"){
      if(localStorage.getItem("notesPIN") && window.triggerNotesUnlock){
        window.triggerNotesUnlock();
      }
    }
  }

  /* ================= TOUCH EVENTS ================= */

  contentArea.addEventListener("touchstart", e=>{
    if(e.touches.length !== 1) return;
    startDrag(
      e.touches[0].clientX,
      e.touches[0].clientY,
      e.target
    );
  },{passive:true});

  contentArea.addEventListener("touchmove", e=>{
    if(!dragging) return;
    moveDrag(
      e.touches[0].clientX,
      e.touches[0].clientY
    );
  },{passive:true});

  contentArea.addEventListener("touchend", endDrag);
  contentArea.addEventListener("touchcancel", cancelDrag);

  /* ================= MOUSE EVENTS ================= */

  contentArea.addEventListener("mousedown", e=>{
    startDrag(e.clientX, e.clientY, e.target);
  });

  contentArea.addEventListener("mousemove", e=>{
    if(!dragging) return;
    moveDrag(e.clientX, e.clientY);
  });

  contentArea.addEventListener("mouseup", endDrag);
  contentArea.addEventListener("mouseleave", cancelDrag);

})();