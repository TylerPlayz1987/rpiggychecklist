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
  let progress = getStoredProgress();
  applyProgress(progress);

  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      progress[checkbox.dataset.key] = checkbox.checked;
      setStoredProgress(progress);
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
