import { recordService } from "./data.js";

// ---------- 1. Find the page elements ----------
const form = document.getElementById("record-form");
const formTitle = document.getElementById("form-title");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const statusInput = document.getElementById("status");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filter-status");
const messageBox = document.getElementById("message");
const resultCount = document.getElementById("result-count");
const recordList = document.getElementById("record-list");
const detailsBox = document.getElementById("details");

// ---------- 2. State: null means "adding", a number means "editing" ----------
let editingId = null;

// ---------- 3. Messages ----------
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = type; // "success" or "error"
}

// ---------- 4. Validation ----------
const allowedStatuses = ["Pending", "In progress", "Completed"];

function validate(data) {
  if (data.title.length < 3 || data.title.length > 80)
    return "Title must be 3 to 80 characters.";
  if (data.category.length < 2 || data.category.length > 40)
    return "Category must be 2 to 40 characters.";
  if (data.description.length < 5 || data.description.length > 300)
    return "Description must be 5 to 300 characters.";
  if (!allowedStatuses.includes(data.status))
    return "Please choose a valid status.";
  return "";
}

// ---------- 5. Reset the form back to "Add" mode ----------
function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = "Add a request";
  saveBtn.textContent = "Save";
  cancelBtn.hidden = true;
}

// ---------- 6. Build one record card ----------
function statusClass(status) {
  if (status === "Pending") return "pending";
  if (status === "In progress") return "progress";
  return "completed";
}

function makeButton(label, action, id, extraClass) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.dataset.action = action;
  btn.dataset.id = id;
  if (extraClass) btn.className = extraClass;
  return btn;
}

function buildCard(record) {
  const card = document.createElement("article");
  card.className = "record-card";

  const h3 = document.createElement("h3");
  h3.textContent = record.title;

  const info = document.createElement("p");
  info.textContent = "#" + record.id + " | " + record.category;

  const badge = document.createElement("span");
  badge.className = "badge " + statusClass(record.status);
  badge.textContent = record.status;

  const actions = document.createElement("div");
  actions.className = "record-actions";
  actions.append(
    makeButton("View", "view", record.id),
    makeButton("Edit", "edit", record.id, "secondary"),
    makeButton("Delete", "delete", record.id, "danger")
  );

  card.append(h3, info, badge, actions);
  return card;
}

// ---------- 7. Draw the list (with search + filter) ----------
async function renderList() {
  const records = await recordService.list();
  const term = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;

  const shown = records.filter(r =>
    r.title.toLowerCase().includes(term) &&
    (status === "" || r.status === status)
  );

  recordList.textContent = "";
  resultCount.textContent = "Showing " + shown.length + " of " + records.length + " records";

  if (shown.length === 0) {
    const p = document.createElement("p");
    p.textContent = records.length === 0
      ? "No records yet. Add your first request above."
      : "No records match your search or filter.";
    recordList.appendChild(p);
    return;
  }

  shown.forEach(r => recordList.appendChild(buildCard(r)));
}

// ---------- 8. Show full details ----------
function showDetails(record) {
  detailsBox.textContent = "";

  const h3 = document.createElement("h3");
  h3.textContent = "Request details";

  const lines = [
    "ID: " + record.id,
    "Title: " + record.title,
    "Category: " + record.category,
    "Description: " + record.description,
    "Status: " + record.status
  ];

  detailsBox.appendChild(h3);
  lines.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    detailsBox.appendChild(p);
  });

  const closeBtn = makeButton("Close", "close", record.id, "secondary");
  detailsBox.appendChild(closeBtn);
  detailsBox.hidden = false;
  detailsBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- 9. Form submit: add or update ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = {
    title: titleInput.value.trim(),
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };

  const error = validate(data);
  if (error) {
    showMessage(error, "error");
    return; // nothing is saved
  }

  try {
    if (editingId === null) {
      await recordService.create(data);
      showMessage("Request added successfully.", "success");
    } else {
      await recordService.update(editingId, data);
      showMessage("Request updated successfully.", "success");
    }
    resetForm();
    detailsBox.hidden = true;
    await renderList();
  } catch (err) {
    showMessage(err.message, "error");
  }
});

// ---------- 10. Cancel edit ----------
cancelBtn.addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled.", "success");
});

// ---------- 11. View / Edit / Delete / Close buttons ----------
recordList.addEventListener("click", handleButton);
detailsBox.addEventListener("click", handleButton);

async function handleButton(event) {
  const btn = event.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  try {
    if (action === "view") {
      showDetails(await recordService.get(id));
    }

    if (action === "close") {
      detailsBox.hidden = true;
    }

    if (action === "edit") {
      const record = await recordService.get(id);
      editingId = record.id;
      titleInput.value = record.title;
      categoryInput.value = record.category;
      descriptionInput.value = record.description;
      statusInput.value = record.status;
      formTitle.textContent = "Edit request #" + record.id;
      saveBtn.textContent = "Update";
      cancelBtn.hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
      titleInput.focus();
    }

    if (action === "delete") {
      const ok = confirm("Delete this request? This cannot be undone.");
      if (!ok) return; // Cancel keeps the record
      await recordService.remove(id);
      if (editingId === id) resetForm();
      detailsBox.hidden = true;
      showMessage("Request deleted.", "success");
      await renderList();
    }
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------- 12. Search and filter ----------
searchInput.addEventListener("input", renderList);
filterStatus.addEventListener("change", renderList);

// ---------- 13. Draw the list when the page loads ----------
renderList();