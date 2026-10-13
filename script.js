const STORAGE_KEY = "rpiggy-checklist-progress";

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

function updateProgressHeadings() {
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

setupTabs();
setupProgressPersistence();
setupExportImport();
