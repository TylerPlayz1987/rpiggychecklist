const STORAGE_KEY = "rpiggy-checklist-progress";
const THEME_STORAGE_KEY = "rpiggy-checklist-theme";

function getStoredProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setStoredProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function applyProgress(progress) {
  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((checkbox) => {
    checkbox.checked = Boolean(progress[checkbox.dataset.key]);
  });
}

function collectProgress() {
  const progress = {};
  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((checkbox) => {
    progress[checkbox.dataset.key] = checkbox.checked;
  });
  return progress;
}

function updateAvailabilityHighlights() {
  document.querySelectorAll("input[data-unobtainable-after]").forEach((checkbox) => {
    const deadline = new Date(checkbox.dataset.unobtainableAfter);
    const row = checkbox.closest("li");
    if (!row || Number.isNaN(deadline.getTime())) {
      return;
    }

    const isStillObtainable = Date.now() < deadline.getTime();
    row.classList.toggle("becoming-unobtainable", isStillObtainable);
    const countdown = document.querySelector(`[data-countdown-for="${checkbox.dataset.key}"]`);
    if (countdown) {
      countdown.textContent = isStillObtainable
        ? `Available for ${formatCountdown(deadline.getTime() - Date.now())}`
        : "No longer obtainable";
    }
    if (isStillObtainable) {
      row.setAttribute("title", "This collectible will soon become unobtainable.");
    } else {
      row.removeAttribute("title");
    }
  });
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function setupAvailabilityCountdowns() {
  updateAvailabilityHighlights();
  window.setInterval(updateAvailabilityHighlights, 1000);
}

function updateTotalProgress() {
  const progressBar = document.getElementById("total-progress-bar");
  const progressCount = document.getElementById("total-progress-count");
  if (!progressBar || !progressCount) {
    return;
  }

  const checkboxes = document.querySelectorAll("input[type='checkbox'][data-key]");
  const checked = document.querySelectorAll("input[type='checkbox'][data-key]:checked");
  progressBar.max = checkboxes.length;
  progressBar.value = checked.length;
  progressBar.setAttribute("aria-label", `Total collectibles: ${checked.length} of ${checkboxes.length} collected`);
  progressCount.textContent = `${checked.length}/${checkboxes.length}`;
}

function updateProgressHeadings() {
  updateAvailabilityHighlights();
  updateTotalProgress();
  document.querySelectorAll("section[data-type]").forEach((section) => {
    const title = section.querySelector("h2[data-title]");
    if (!title) {
      return;
    }

    const checkboxes = section.querySelectorAll("input[type='checkbox'][data-key]");
    const checked = section.querySelectorAll("input[type='checkbox'][data-key]:checked");
    const unobtainable = section.querySelectorAll("input[type='checkbox'][data-unobtainable='true']");
    const checkedUnobtainable = section.querySelectorAll("input[type='checkbox'][data-unobtainable='true']:checked");

    let text = `${title.dataset.title} ${checked.length}/${checkboxes.length}`;
    if (unobtainable.length > 0) {
      text += ` Unobtainable ${checkedUnobtainable.length}/${unobtainable.length}`;
    }
    title.textContent = text;

    section.querySelectorAll("[data-subtype]").forEach((subtype) => {
      const subtypeTitle = subtype.querySelector("h3[data-title]");
      if (!subtypeTitle) {
        return;
      }
      const subtypeCheckboxes = subtype.querySelectorAll("input[type='checkbox'][data-key]");
      const checkedSubtype = subtype.querySelectorAll("input[type='checkbox'][data-key]:checked");
      subtypeTitle.textContent = `${subtypeTitle.dataset.title} ${checkedSubtype.length}/${subtypeCheckboxes.length}`;
      const subtypeButton = section.querySelector(`[data-subtype-tab="${subtype.id}"]`);
      if (subtypeButton) {
        subtypeButton.textContent = subtypeTitle.textContent;
      }
    });
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((other) => {
        other.classList.remove("active");
        other.setAttribute("aria-selected", "false");
      });
      panels.forEach((panel) => {
        panel.classList.remove("active");
        panel.hidden = true;
      });

      button.classList.add("active");
      button.setAttribute("aria-selected", "true");

      const panel = document.getElementById(button.dataset.tab);
      if (panel) {
        panel.classList.add("active");
        panel.hidden = false;
      }
    });
  });
}

function setupSubtypeTabs() {
  document.querySelectorAll("section[data-type]").forEach((section) => {
    const groups = [...section.querySelectorAll(":scope > [data-subtype]")];
    if (groups.length === 0) {
      return;
    }

    const tabList = document.createElement("div");
    tabList.className = "subtype-tabs";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", `${section.querySelector("h2")?.dataset.title || "Category"} subtypes`);

    groups.forEach((group, index) => {
      const title = group.querySelector("h3[data-title]");
      const id = `${section.id}-subtype-${index}`;
      const panelId = `${id}-panel`;
      group.id = panelId;
      group.setAttribute("role", "tabpanel");
      group.setAttribute("aria-labelledby", id);
      group.hidden = index !== 0;

      const button = document.createElement("button");
      button.className = "subtype-tab-button";
      button.type = "button";
      button.id = id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panelId);
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");
      button.dataset.subtypeTab = panelId;
      button.textContent = title?.textContent || `Subtype ${index + 1}`;
      button.addEventListener("click", () => {
        groups.forEach((otherGroup) => {
          const otherButton = tabList.querySelector(`[data-subtype-tab="${otherGroup.id}"]`);
          const isSelected = otherGroup === group;
          otherGroup.hidden = !isSelected;
          otherButton?.classList.toggle("active", isSelected);
          otherButton?.setAttribute("aria-selected", isSelected ? "true" : "false");
        });
      });
      if (index === 0) {
        button.classList.add("active");
      }
      tabList.append(button);
    });

    section.insertBefore(tabList, groups[0]);
  });
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) {
    return;
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const initialTheme = storedTheme === "dark" ? "dark" : "light";

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  };

  applyTheme(initialTheme);
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

function setupProgressPersistence() {
  const progress = getStoredProgress();
  applyProgress(progress);
  updateProgressHeadings();

  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      progress[checkbox.dataset.key] = checkbox.checked;
      setStoredProgress(progress);
      updateProgressHeadings();
    });
  });
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function setupExportImport() {
  const exportButton = document.getElementById("export-button");
  const importInput = document.getElementById("import-input");

  exportButton?.addEventListener("click", () => {
    const progress = collectProgress();
    downloadFile("rpiggy-checklist-progress.json", JSON.stringify(progress, null, 2));
  });

  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported || typeof imported !== "object") {
        throw new Error("Invalid data");
      }
      setStoredProgress(imported);
      applyProgress(imported);
      updateProgressHeadings();
    } catch {
      alert("Unable to import file. Please use a valid export file.");
    } finally {
      event.target.value = "";
    }
  });
}

setupThemeToggle();
setupTabs();
setupSubtypeTabs();
setupProgressPersistence();
setupExportImport();
setupAvailabilityCountdowns();
