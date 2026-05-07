const STORAGE_KEY = "executiveScheduleApp.v1";
const SUPABASE_CONFIG_KEY = `${STORAGE_KEY}.supabase`;
const DEFAULT_SUPABASE_CONFIG = {
  url: "https://jitleoweloogqflgspnx.supabase.co/rest/v1/",
  anonKey: "sb_publishable_tdPj2LiqXhD3ii-p-geXng_0g0TXvY4"
};

const divisions = [
  { id: "policyPlanningOffice", name: "정책기획관실" },
  { id: "internationalAgriFoodCooperationOffice", name: "국제농식품협력관실" },
  { id: "ruralPolicyBureau", name: "농촌정책국" },
  { id: "agriculturalPolicyOffice", name: "농업정책관실" },
  { id: "agriIndustryInnovationPolicyOffice", name: "농산업혁신정책관실" },
  { id: "ruralIncomeEnergyPolicyOffice", name: "농촌소득에너지정책관실" },
  { id: "foodIndustryPolicyOffice", name: "식품산업정책관실" },
  { id: "animalWelfarePolicyBureau", name: "동물복지정책국" },
  { id: "grainPolicyOffice", name: "식량정책관실" },
  { id: "livestockPolicyOffice", name: "축산정책관실" },
  { id: "distributionConsumptionPolicyOffice", name: "유통소비정책관실" },
  { id: "quarantinePolicyBureau", name: "방역정책국" }
];

const divisionAliases = {
  planning: "policyPlanningOffice",
  policy: "policyPlanningOffice",
  operation: "policyPlanningOffice",
  digital: "policyPlanningOffice",
  policyPlanning: "policyPlanningOffice",
  livestock: "livestockPolicyOffice",
  quarantine: "quarantinePolicyBureau"
};

const ranks = [
  { id: "minister", label: "장관", color: "#bd3f32", adminOnly: true },
  { id: "vice", label: "차관", color: "#2d6fb2", adminOnly: true },
  { id: "secretary", label: "실장", color: "#7661b3", adminOnly: true },
  { id: "director", label: "국장", color: "#16856a", adminOnly: false },
  { id: "manager", label: "과장", color: "#c1741b", adminOnly: false }
];

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long"
});

const state = {
  divisionId: "policyPlanningOffice",
  role: "member",
  userName: "홍길동",
  view: "month",
  cursorDate: startOfDay(new Date()),
  filters: new Set(ranks.map((rank) => rank.id)),
  showArchived: false,
  data: null,
  supabase: {
    url: "",
    anonKey: "",
    enabled: false,
    connected: false,
    statusText: "로컬 저장",
    statusKind: "local"
  }
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindElements();
  hydrateSession();
  hydrateSupabaseConfig();
  renderStaticControls();
  bindEvents();
  await loadData();
  render();
}

function bindElements() {
  Object.assign(els, {
    todayLabel: document.querySelector("#todayLabel"),
    divisionSelect: document.querySelector("#divisionSelect"),
    roleSelect: document.querySelector("#roleSelect"),
    userNameInput: document.querySelector("#userNameInput"),
    resetFilterButton: document.querySelector("#resetFilterButton"),
    rankFilters: document.querySelector("#rankFilters"),
    legend: document.querySelector("#legend"),
    historyList: document.querySelector("#historyList"),
    prevButton: document.querySelector("#prevButton"),
    nextButton: document.querySelector("#nextButton"),
    todayButton: document.querySelector("#todayButton"),
    periodTitle: document.querySelector("#periodTitle"),
    periodSubtitle: document.querySelector("#periodSubtitle"),
    monthViewButton: document.querySelector("#monthViewButton"),
    weekViewButton: document.querySelector("#weekViewButton"),
    showArchivedToggle: document.querySelector("#showArchivedToggle"),
    newEventButton: document.querySelector("#newEventButton"),
    permissionNotice: document.querySelector("#permissionNotice"),
    monthView: document.querySelector("#monthView"),
    weekView: document.querySelector("#weekView"),
    eventDialog: document.querySelector("#eventDialog"),
    eventForm: document.querySelector("#eventForm"),
    dialogTitle: document.querySelector("#dialogTitle"),
    closeDialogButton: document.querySelector("#closeDialogButton"),
    cancelButton: document.querySelector("#cancelButton"),
    eventId: document.querySelector("#eventId"),
    eventDate: document.querySelector("#eventDate"),
    eventStartTime: document.querySelector("#eventStartTime"),
    eventEndTime: document.querySelector("#eventEndTime"),
    eventRank: document.querySelector("#eventRank"),
    eventPerson: document.querySelector("#eventPerson"),
    eventLocation: document.querySelector("#eventLocation"),
    eventTitle: document.querySelector("#eventTitle"),
    eventMemo: document.querySelector("#eventMemo"),
    deleteEventButton: document.querySelector("#deleteEventButton"),
    supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
    supabaseAnonKeyInput: document.querySelector("#supabaseAnonKeyInput"),
    supabaseConnectButton: document.querySelector("#supabaseConnectButton"),
    supabaseDisconnectButton: document.querySelector("#supabaseDisconnectButton"),
    supabaseStatus: document.querySelector("#supabaseStatus")
  });
}

async function loadData() {
  if (state.supabase.enabled) {
    setSupabaseStatus("Supabase 연결 중", "pending");
    try {
      state.data = await fetchSupabaseData();
      state.supabase.connected = true;
      setSupabaseStatus("Supabase 연결됨", "connected");
      return;
    } catch (error) {
      state.supabase.connected = false;
      setSupabaseStatus("Supabase 연결 실패", "error");
      console.warn(error);
    }
  }

  state.data = loadLocalData();
  state.supabase.connected = false;
  if (!state.supabase.enabled) {
    setSupabaseStatus("로컬 저장", "local");
  }
}

function loadLocalData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return normalizeData(JSON.parse(stored));
  }

  const data = createInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function createInitialData() {
  const today = startOfDay(new Date());
  const date = (offset) => toDateInput(addDays(today, offset));
  const now = new Date().toISOString();

  return {
    events: [
      sampleEvent("policyPlanningOffice", "director", "정책기획관", "09:30", "", date(0), "국정과제 점검회의", "대회의실", "주간 주요 현안"),
      sampleEvent("internationalAgriFoodCooperationOffice", "manager", "국제협력총괄과장", "14:00", "", date(1), "국제협력 현안 점검", "소회의실", ""),
      sampleEvent("ruralPolicyBureau", "director", "농촌정책국장", "10:00", "", date(2), "농촌정책 추진상황 점검", "회의실 A", ""),
      sampleEvent("agriculturalPolicyOffice", "manager", "농업정책과장", "16:30", "", date(3), "농업정책 현안 보고", "정책관실", ""),
      sampleEvent("agriIndustryInnovationPolicyOffice", "secretary", "실장", "11:00", "", date(4), "정책 조정회의", "정부서울청사", "공개 일정 기준"),
      sampleEvent("ruralIncomeEnergyPolicyOffice", "director", "농촌소득에너지정책관", "08:40", "", date(0), "농촌소득 사업 점검", "영상회의실", ""),
      sampleEvent("foodIndustryPolicyOffice", "manager", "식품산업정책과장", "15:00", "", date(2), "식품산업 소관 과제 검토", "중회의실", ""),
      sampleEvent("animalWelfarePolicyBureau", "director", "동물복지정책국장", "09:00", "", date(1), "동물복지 주요 업무보고", "국장실", ""),
      sampleEvent("grainPolicyOffice", "manager", "식량정책과장", "13:30", "", date(3), "식량수급 점검회의", "회의실 B", ""),
      sampleEvent("livestockPolicyOffice", "director", "축산정책관", "08:40", "", date(0), "축산 현안 간담회", "영상회의실", ""),
      sampleEvent("distributionConsumptionPolicyOffice", "manager", "유통정책과장", "15:30", "", date(2), "유통소비 현안 점검", "회의실 C", ""),
      sampleEvent("quarantinePolicyBureau", "minister", "장관", "10:00", "", date(2), "국회 상임위 전체회의", "국회", "공개 일정 기준"),
      sampleEvent("quarantinePolicyBureau", "vice", "차관", "16:30", "", date(3), "방역 현안 보고", "차관실", "공개 일정 기준"),
      sampleEvent("quarantinePolicyBureau", "manager", "방역정책과장", "14:00", "", date(1), "방역 현안 점검", "소회의실", "")
    ],
    history: [
      {
        id: cryptoId(),
        divisionId: "policyPlanningOffice",
        action: "초기 데이터 생성",
        title: "간부 일정관리",
        actor: "시스템",
        at: now,
        detail: "예시 일정이 등록되었습니다."
      }
    ]
  };
}

function sampleEvent(divisionId, rank, person, startTime, endTime, date, title, location, memo) {
  const now = new Date().toISOString();
  return {
    id: cryptoId(),
    divisionId,
    rank,
    person,
    date,
    startTime,
    endTime,
    title,
    location,
    memo,
    createdBy: "시스템",
    updatedBy: "시스템",
    createdAt: now,
    updatedAt: now,
    deleted: false
  };
}

function hydrateSession() {
  const session = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.session`) || "{}");
  state.divisionId = normalizeDivisionId(session.divisionId || state.divisionId);
  state.role = session.role || state.role;
  state.userName = session.userName || state.userName;
  state.showArchived = Boolean(session.showArchived);
}

function saveSession() {
  localStorage.setItem(
    `${STORAGE_KEY}.session`,
    JSON.stringify({
      divisionId: state.divisionId,
      role: state.role,
      userName: state.userName,
      showArchived: state.showArchived
    })
  );
}

function hydrateSupabaseConfig() {
  const config = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || "{}");
  state.supabase.url = normalizeSupabaseUrl(config.url || DEFAULT_SUPABASE_CONFIG.url);
  state.supabase.anonKey = config.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey;
  state.supabase.enabled = Boolean(state.supabase.url && state.supabase.anonKey);
}

function saveSupabaseConfig() {
  localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({
      url: state.supabase.url,
      anonKey: state.supabase.anonKey
    })
  );
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function renderStaticControls() {
  els.todayLabel.textContent = dateFormatter.format(new Date());
  els.divisionSelect.innerHTML = divisions
    .map((division) => `<option value="${division.id}">${division.name}</option>`)
    .join("");
  els.divisionSelect.value = state.divisionId;
  els.roleSelect.value = state.role;
  els.userNameInput.value = state.userName;
  els.showArchivedToggle.checked = state.showArchived;
  if (els.supabaseUrlInput) els.supabaseUrlInput.value = state.supabase.url;
  if (els.supabaseAnonKeyInput) els.supabaseAnonKeyInput.value = state.supabase.anonKey;

  els.eventRank.innerHTML = ranks
    .map((rank) => `<option value="${rank.id}">${rank.label}</option>`)
    .join("");

  els.rankFilters.innerHTML = ranks
    .map(
      (rank) => `
        <label class="filter-option">
          <input type="checkbox" value="${rank.id}" checked>
          <span>${rank.label}</span>
        </label>
      `
    )
    .join("");

  els.legend.innerHTML = ranks
    .map(
      (rank) => `
        <div class="legend-item">
          <span class="legend-chip" style="background:${rank.color}"></span>
          <span>${rank.label}</span>
        </div>
      `
    )
    .join("");
}

function bindEvents() {
  els.divisionSelect.addEventListener("change", () => {
    state.divisionId = els.divisionSelect.value;
    saveSession();
    render();
  });

  els.roleSelect.addEventListener("change", () => {
    state.role = els.roleSelect.value;
    saveSession();
    render();
  });

  els.userNameInput.addEventListener("input", () => {
    state.userName = els.userNameInput.value.trim() || "사용자";
    saveSession();
  });

  els.resetFilterButton.addEventListener("click", () => {
    state.filters = new Set(ranks.map((rank) => rank.id));
    document.querySelectorAll("#rankFilters input").forEach((input) => {
      input.checked = true;
    });
    render();
  });

  els.rankFilters.addEventListener("change", (event) => {
    if (!event.target.matches("input")) return;
    if (event.target.checked) {
      state.filters.add(event.target.value);
    } else {
      state.filters.delete(event.target.value);
    }
    render();
  });

  els.prevButton.addEventListener("click", () => {
    state.cursorDate =
      state.view === "month" ? addMonths(state.cursorDate, -1) : addDays(state.cursorDate, -7);
    render();
  });

  els.nextButton.addEventListener("click", () => {
    state.cursorDate =
      state.view === "month" ? addMonths(state.cursorDate, 1) : addDays(state.cursorDate, 7);
    render();
  });

  els.todayButton.addEventListener("click", () => {
    state.cursorDate = startOfDay(new Date());
    render();
  });

  els.monthViewButton.addEventListener("click", () => {
    state.view = "month";
    render();
  });

  els.weekViewButton.addEventListener("click", () => {
    state.view = "week";
    render();
  });

  els.showArchivedToggle.addEventListener("change", () => {
    state.showArchived = els.showArchivedToggle.checked;
    saveSession();
    render();
  });

  if (els.supabaseConnectButton) {
    els.supabaseConnectButton.addEventListener("click", handleSupabaseConnect);
  }
  if (els.supabaseDisconnectButton) {
    els.supabaseDisconnectButton.addEventListener("click", handleSupabaseDisconnect);
  }
  els.newEventButton.addEventListener("click", () => openEventDialog({ date: toDateInput(state.cursorDate) }));
  els.closeDialogButton.addEventListener("click", () => els.eventDialog.close());
  els.cancelButton.addEventListener("click", () => els.eventDialog.close());
  els.eventForm.addEventListener("submit", saveEventFromForm);
  els.deleteEventButton.addEventListener("click", deleteCurrentEvent);
}

async function handleSupabaseConnect() {
  const url = normalizeSupabaseUrl(els.supabaseUrlInput.value);
  const anonKey = els.supabaseAnonKeyInput.value.trim();

  if (!url || !anonKey) {
    alert("Supabase URL과 anon key를 입력해주세요.");
    return;
  }

  state.supabase.url = url;
  state.supabase.anonKey = anonKey;
  state.supabase.enabled = true;
  saveSupabaseConfig();
  setSupabaseStatus("Supabase 연결 중", "pending");

  try {
    state.data = await fetchSupabaseData();
    state.supabase.connected = true;
    setSupabaseStatus("Supabase 연결됨", "connected");
    render();
  } catch (error) {
    state.supabase.connected = false;
    setSupabaseStatus("Supabase 연결 실패", "error");
    alert(`Supabase 연결에 실패했습니다.\n${error.message}`);
  }
}

function handleSupabaseDisconnect() {
  state.supabase.url = "";
  state.supabase.anonKey = "";
  state.supabase.enabled = false;
  state.supabase.connected = false;
  saveSupabaseConfig();
  els.supabaseUrlInput.value = "";
  els.supabaseAnonKeyInput.value = "";
  state.data = loadLocalData();
  setSupabaseStatus("로컬 저장", "local");
  render();
}

function render() {
  const division = divisions.find((item) => item.id === state.divisionId);
  const storageLabel = state.supabase.connected ? "Supabase DB" : "브라우저 로컬 저장";
  els.permissionNotice.textContent =
    state.role === "admin"
      ? `${division.name} 관리자: 장관·차관·실장·국장·과장 일정을 등록, 수정, 삭제할 수 있습니다. 현재 저장소: ${storageLabel}.`
      : `${division.name} 구성원: 국장·과장 일정은 등록·수정할 수 있고 장관·차관·실장 일정은 열람만 가능합니다. 현재 저장소: ${storageLabel}.`;

  renderSupabaseStatus();
  els.monthViewButton.classList.toggle("active", state.view === "month");
  els.weekViewButton.classList.toggle("active", state.view === "week");
  els.monthViewButton.setAttribute("aria-selected", state.view === "month");
  els.weekViewButton.setAttribute("aria-selected", state.view === "week");
  els.monthView.classList.toggle("hidden", state.view !== "month");
  els.weekView.classList.toggle("hidden", state.view !== "week");

  if (state.view === "month") {
    renderMonth();
  } else {
    renderWeek();
  }
  renderHistory();
}

function renderSupabaseStatus() {
  if (!els.supabaseStatus) return;
  els.supabaseStatus.textContent = state.supabase.statusText;
  els.supabaseStatus.className = `sync-status ${state.supabase.statusKind}`;
}

function renderMonth() {
  const year = state.cursorDate.getFullYear();
  const month = state.cursorDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  els.periodTitle.textContent = `${year}년 ${month + 1}월`;
  els.periodSubtitle.textContent = currentDivisionName();

  const weekdayHtml = weekdays.map((day) => `<div class="weekday">${day}</div>`).join("");
  const dayHtml = days.map((date) => renderMonthDay(date, month)).join("");
  els.monthView.innerHTML = weekdayHtml + dayHtml;

  els.monthView.querySelectorAll("[data-open-date]").forEach((button) => {
    button.addEventListener("click", () => openEventDialog({ date: button.dataset.openDate }));
  });

  els.monthView.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const event = state.data.events.find((item) => item.id === button.dataset.eventId);
      openEventDialog({ event });
    });
  });
}

function renderMonthDay(date, activeMonth) {
  const dateKey = toDateInput(date);
  const events = getVisibleEvents().filter((event) => event.date === dateKey);
  const topEvents = events.slice(0, 4);
  const desktopMoreCount = events.length - 4;
  const mobileMoreCount = events.length - 2;
  const isOutside = date.getMonth() !== activeMonth;
  const isToday = dateKey === toDateInput(new Date());

  return `
    <div class="day-cell ${isOutside ? "outside" : ""} ${isToday ? "today" : ""}">
      <div class="day-head">
        <span class="day-number">${date.getDate()}</span>
        <button class="small-add" type="button" data-open-date="${dateKey}" title="일정 등록" aria-label="${dateKey} 일정 등록">+</button>
      </div>
      <div class="event-stack">
        ${topEvents.map(renderEventPill).join("")}
        ${desktopMoreCount > 0 ? `<div class="more-count desktop-more-count">+${desktopMoreCount}</div>` : ""}
        ${mobileMoreCount > 0 ? `<div class="more-count mobile-more-count">+${mobileMoreCount}</div>` : ""}
      </div>
    </div>
  `;
}

function renderEventPill(event) {
  const rank = rankById(event.rank);
  return `
    <button class="event-pill" type="button" data-event-id="${event.id}" style="--event-color:${rank.color}">
      <span class="event-time">(${event.startTime})</span>
      <span class="event-name">${escapeHtml(event.title)}</span>
    </button>
  `;
}

function renderWeek() {
  const weekStart = startOfWeek(state.cursorDate);
  const weekEnd = addDays(weekStart, 6);
  els.periodTitle.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  els.periodSubtitle.textContent = `${currentDivisionName()} 주간 일정`;

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  els.weekView.innerHTML = days.map(renderWeekDay).join("");

  els.weekView.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const event = state.data.events.find((item) => item.id === button.dataset.eventId);
      openEventDialog({ event });
    });
  });
}

function renderWeekDay(date) {
  const dateKey = toDateInput(date);
  const events = getVisibleEvents()
    .filter((event) => event.date === dateKey)
    .sort(compareEvents);

  return `
    <div class="week-day">
      <div class="week-date">
        <strong>${date.getDate()}일 ${weekdays[date.getDay()]}</strong>
        <span>${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}</span>
      </div>
      <div class="week-events">
        ${
          events.length
            ? events.map(renderWeekEvent).join("")
            : `<div class="empty-state">등록된 일정이 없습니다.</div>`
        }
      </div>
    </div>
  `;
}

function renderWeekEvent(event) {
  const rank = rankById(event.rank);
  const time = event.endTime ? `(${event.startTime}-${event.endTime})` : `(${event.startTime})`;
  const meta = [event.person, event.location].filter(Boolean).join(" · ");
  return `
    <button class="week-event" type="button" data-event-id="${event.id}" style="--event-color:${rank.color}">
      <span class="event-time">${time}</span>
      <span class="rank-badge">${rank.label}</span>
      <span class="week-title">${escapeHtml(event.title)}</span>
      <span class="week-meta">${escapeHtml(meta)}</span>
    </button>
  `;
}

function renderHistory() {
  const items = state.data.history
    .filter((item) => item.divisionId === state.divisionId)
    .slice()
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  els.historyList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <div class="history-item">
              <strong>${escapeHtml(item.action)}</strong>
              <span>${escapeHtml(item.title)} · ${escapeHtml(item.actor)} · ${formatDateTime(item.at)}</span>
              <span>${escapeHtml(item.detail || "")}</span>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">변경 이력이 없습니다.</div>`;
}

function openEventDialog({ date, event } = {}) {
  const selected = event || null;
  const rank = selected ? rankById(selected.rank) : rankById("director");
  const editingRestricted = selected && !canEditRank(selected.rank);

  els.dialogTitle.textContent = selected ? "일정 수정" : "일정 등록";
  els.eventId.value = selected?.id || "";
  els.eventDate.value = selected?.date || date || toDateInput(new Date());
  els.eventStartTime.value = selected?.startTime || "09:00";
  els.eventEndTime.value = selected?.endTime || "";
  els.eventRank.value = selected?.rank || "director";
  els.eventPerson.value = selected?.person || rank.label;
  els.eventLocation.value = selected?.location || "";
  els.eventTitle.value = selected?.title || "";
  els.eventMemo.value = selected?.memo || "";
  els.deleteEventButton.classList.toggle("hidden", !selected);
  els.deleteEventButton.disabled = !selected || state.role !== "admin";

  setFormDisabled(editingRestricted);
  if (editingRestricted) {
    els.dialogTitle.textContent = "일정 열람";
  }

  els.eventDialog.showModal();
}

function setFormDisabled(isDisabled) {
  [
    els.eventDate,
    els.eventStartTime,
    els.eventEndTime,
    els.eventRank,
    els.eventPerson,
    els.eventLocation,
    els.eventTitle,
    els.eventMemo
  ].forEach((field) => {
    field.disabled = isDisabled;
  });
  els.eventForm.querySelector('button[type="submit"]').disabled = isDisabled;
}

async function saveEventFromForm(event) {
  event.preventDefault();
  const rank = els.eventRank.value;
  if (!canEditRank(rank)) {
    alert("장관·차관·실장 일정은 관리자만 등록·수정할 수 있습니다.");
    return;
  }

  const id = els.eventId.value;
  const now = new Date().toISOString();
  const payload = {
    divisionId: state.divisionId,
    rank,
    date: els.eventDate.value,
    startTime: els.eventStartTime.value,
    endTime: els.eventEndTime.value,
    person: els.eventPerson.value.trim(),
    location: els.eventLocation.value.trim(),
    title: els.eventTitle.value.trim(),
    memo: els.eventMemo.value.trim(),
    updatedBy: state.userName,
    updatedAt: now,
    deleted: false
  };

  let savedEvent;
  let historyItem;

  if (id) {
    const index = state.data.events.findIndex((item) => item.id === id);
    const before = state.data.events[index];
    savedEvent = { ...before, ...payload };
    state.data.events[index] = savedEvent;
    historyItem = addHistory("일정 수정", payload.title, changeSummary(before, payload));
  } else {
    savedEvent = {
      id: cryptoId(),
      ...payload,
      createdBy: state.userName,
      createdAt: now
    };
    state.data.events.push(savedEvent);
    historyItem = addHistory("일정 등록", payload.title, `${rankById(rank).label} · ${payload.date} ${payload.startTime}`);
  }

  saveData();

  if (state.supabase.connected) {
    try {
      await saveEventToSupabase(savedEvent);
      await saveHistoryToSupabase(historyItem);
      setSupabaseStatus("Supabase 저장됨", "connected");
    } catch (error) {
      setSupabaseStatus("Supabase 저장 실패", "error");
      alert(`로컬에는 저장했지만 Supabase 저장에 실패했습니다.\n${error.message}`);
    }
  }

  els.eventDialog.close();
  render();
}

async function deleteCurrentEvent() {
  if (state.role !== "admin") {
    alert("삭제는 관리자만 가능합니다.");
    return;
  }

  const id = els.eventId.value;
  const event = state.data.events.find((item) => item.id === id);
  if (!event) return;

  event.deleted = true;
  event.updatedBy = state.userName;
  event.updatedAt = new Date().toISOString();
  const historyItem = addHistory("일정 삭제", event.title, `${rankById(event.rank).label} · ${event.date} ${event.startTime}`);
  saveData();

  if (state.supabase.connected) {
    try {
      await saveEventToSupabase(event);
      await saveHistoryToSupabase(historyItem);
      setSupabaseStatus("Supabase 저장됨", "connected");
    } catch (error) {
      setSupabaseStatus("Supabase 저장 실패", "error");
      alert(`로컬에는 반영했지만 Supabase 저장에 실패했습니다.\n${error.message}`);
    }
  }

  els.eventDialog.close();
  render();
}

function addHistory(action, title, detail) {
  const item = {
    id: cryptoId(),
    divisionId: state.divisionId,
    action,
    title,
    actor: state.userName,
    at: new Date().toISOString(),
    detail
  };
  state.data.history.push(item);
  return item;
}

function changeSummary(before, after) {
  const changed = [];
  [
    ["date", "날짜"],
    ["startTime", "시작"],
    ["endTime", "종료"],
    ["rank", "구분"],
    ["person", "대상"],
    ["title", "일정"],
    ["location", "장소"]
  ].forEach(([key, label]) => {
    if ((before[key] || "") !== (after[key] || "")) {
      const beforeValue = key === "rank" ? rankById(before[key]).label : before[key] || "-";
      const afterValue = key === "rank" ? rankById(after[key]).label : after[key] || "-";
      changed.push(`${label}: ${beforeValue} → ${afterValue}`);
    }
  });
  return changed.length ? changed.join(", ") : "메모 또는 세부 내용 변경";
}

function getVisibleEvents() {
  const archiveLimit = addDays(startOfDay(new Date()), -14);
  return state.data.events
    .filter((event) => !event.deleted)
    .filter((event) => event.divisionId === state.divisionId)
    .filter((event) => state.filters.has(event.rank))
    .filter((event) => state.showArchived || new Date(`${event.date}T00:00:00`) >= archiveLimit)
    .sort(compareEvents);
}

async function fetchSupabaseData() {
  const [eventRows, historyRows] = await Promise.all([
    supabaseRequest("events?select=*&order=date.asc,start_time.asc"),
    supabaseRequest("event_history?select=*&order=changed_at.desc&limit=300")
  ]);

  return normalizeData({
    events: eventRows.map(dbToEvent),
    history: historyRows.map(dbToHistory)
  });
}

async function saveEventToSupabase(event) {
  await supabaseRequest("events?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(eventToDb(event))
  });
}

async function saveHistoryToSupabase(item) {
  await supabaseRequest("event_history", {
    method: "POST",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(historyToDb(item))
  });
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${state.supabase.url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: state.supabase.anonKey,
      Authorization: `Bearer ${state.supabase.anonKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(formatSupabaseError(message, response.status));
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function eventToDb(event) {
  return {
    id: event.id,
    division_id: event.divisionId,
    rank: event.rank,
    person: event.person,
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime || null,
    title: event.title,
    location: event.location || "",
    memo: event.memo || "",
    created_by: event.createdBy || state.userName,
    updated_by: event.updatedBy || state.userName,
    created_at: event.createdAt || new Date().toISOString(),
    updated_at: event.updatedAt || new Date().toISOString(),
    deleted: Boolean(event.deleted)
  };
}

function dbToEvent(row) {
  return {
    id: row.id,
    divisionId: row.division_id,
    rank: row.rank,
    person: row.person,
    date: row.date,
    startTime: trimTime(row.start_time),
    endTime: trimTime(row.end_time),
    title: row.title,
    location: row.location || "",
    memo: row.memo || "",
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: Boolean(row.deleted)
  };
}

function historyToDb(item) {
  return {
    id: item.id,
    division_id: item.divisionId,
    action: item.action,
    title: item.title,
    actor: item.actor,
    detail: item.detail || "",
    changed_at: item.at
  };
}

function dbToHistory(row) {
  return {
    id: row.id,
    divisionId: row.division_id,
    action: row.action,
    title: row.title,
    actor: row.actor,
    detail: row.detail || "",
    at: row.changed_at
  };
}

function normalizeData(data) {
  return {
    events: Array.isArray(data?.events)
      ? data.events.map((event) => ({
          ...event,
          divisionId: normalizeDivisionId(event.divisionId)
        }))
      : [],
    history: Array.isArray(data?.history)
      ? data.history.map((item) => ({
          ...item,
          divisionId: normalizeDivisionId(item.divisionId)
        }))
      : []
  };
}

function formatSupabaseError(message, status) {
  try {
    const parsed = JSON.parse(message);
    if (parsed.code === "PGRST205") {
      return "Supabase에 events 또는 event_history 테이블이 없습니다. supabase-schema.sql을 SQL Editor에서 먼저 실행해주세요.";
    }
    return parsed.message || message || `HTTP ${status}`;
  } catch {
    return message || `HTTP ${status}`;
  }
}

function normalizeDivisionId(id) {
  if (divisions.some((division) => division.id === id)) return id;
  if (divisionAliases[id]) return divisionAliases[id];
  return divisions[0].id;
}

function setSupabaseStatus(text, kind) {
  state.supabase.statusText = text;
  state.supabase.statusKind = kind;
  if (els.supabaseStatus) renderSupabaseStatus();
}

function normalizeSupabaseUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "");
}

function trimTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function compareEvents(a, b) {
  return `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
}

function rankById(id) {
  return ranks.find((rank) => rank.id === id) || ranks[0];
}

function canEditRank(rankId) {
  const rank = rankById(rankId);
  return !rank.adminOnly || state.role === "admin";
}

function currentDivisionName() {
  return divisions.find((division) => division.id === state.divisionId)?.name || "";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  return addDays(startOfDay(date), -date.getDay());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toDateInput(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date) {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}.${day} ${hour}:${minute}`;
}

function cryptoId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const random = window.crypto?.getRandomValues
      ? window.crypto.getRandomValues(new Uint8Array(1))[0] & 15
      : Math.floor(Math.random() * 16);
    return (Number(char) ^ (random >> (Number(char) / 4))).toString(16);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
