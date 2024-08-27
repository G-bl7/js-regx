// Constants
const ADD_REGEX_DIALOG_ID = "add-regx-dialog";
const ADD_REGEX_FORM_ID = "add-regx-form";
const NAME_INPUT_ID = "name-input";
const PATTERN_INPUT_ID = "pattern-input";
const REGEX_LIST_TABLE_ID = "regx_list";

// DOM elements
let addRegexDialog;
let addRegexForm;
let nameInput;
let patternInput;
let regexListTable;

document.addEventListener("DOMContentLoaded", init);

function init() {
  addRegexDialog = document.getElementById(ADD_REGEX_DIALOG_ID);
  addRegexForm = document.getElementById(ADD_REGEX_FORM_ID);
  nameInput = document.getElementById(NAME_INPUT_ID);
  patternInput = document.getElementById(PATTERN_INPUT_ID);
  regexListTable = document.getElementById(REGEX_LIST_TABLE_ID);

  document
    .getElementById("bt-add-regx")
    .addEventListener("click", showAddRegexDialog);
  document
    .getElementById("bt-del-regx")
    .addEventListener("click", deleteSelectedRegex);
  loadRegexList();

  // Move the event listener addition here
  addRegexForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value;
    const pattern = patternInput.value;
    addRegexToList(name, pattern);
    addRegexDialog.close();
  });

  // Add cancel form
  document.getElementById("cancel-btn").addEventListener("click", () => {
    addRegexDialog.close();
  });
}

// Add regex dialog
function showAddRegexDialog() {
  addRegexDialog.showModal();
}

// Add regex to list
function addRegexToList(name, pattern) {
  chrome.runtime.sendMessage({ action: "add-regx", name, pattern });
}

// Load regex list
function loadRegexList() {
  chrome.runtime.sendMessage({ action: "get-regx" }, (response) => {
    const regexList = response.regexList;
    regexListTable.innerHTML = ""; // Clear the table body

    regexList.forEach((regex) => {
      const row = document.createElement("tr");

      const checkcell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "controler";
      checkbox.dataset.id = regex.id;
      checkcell.appendChild(checkbox);

      const idcell = document.createElement("td");
      idcell.textContent = regex.id;

      const nameCell = document.createElement("td");
      nameCell.textContent = regex.name;

      const patternCell = document.createElement("td");
      patternCell.textContent = regex.pattern;

      row.appendChild(checkcell);
      row.appendChild(idcell);
      row.appendChild(nameCell);
      row.appendChild(patternCell);

      regexListTable.appendChild(row);
    });
  });
}

// Delete regex
function deleteRegex(id) {
  chrome.runtime.sendMessage({ action: "delete-regx", id });
  loadRegexList(); // Reload the regex list
}

// Delete selected regex
function deleteSelectedRegex() {
  const checkboxes = document.querySelectorAll(".controler:checked");
  const regexIds = Array.prototype.map.call(
    checkboxes,
    (checkbox) => checkbox.dataset.id
  );
  chrome.runtime.sendMessage(
    { action: "delete-regx", ids: regexIds },
    (response) => {
      if (response.success) {
        loadRegexList(); // Reload the regex list only when all delete operations are done
      }
    }
  );
}
