document.addEventListener("DOMContentLoaded", main);

function main() {
  chrome.runtime.sendMessage({ action: "get-regx" }, (response) => {
    const regexList = response.regexList;
    const datalist = document.getElementById("list_filters");
    datalist.innerHTML = "";
    if (regexList.length > 0) {
      const filter = document.getElementById("filter_id");
      filter.value = regexList[0].name;
      filter.dataset.id = regexList[0].id;
      filter.dataset.regx = regexList[0].pattern;
    }
    regexList.forEach((element) => {
      const option = document.createElement("option");
      option.value = element.name;
      option.dataset.id = element.id;
      option.dataset.filter = element.pattern;
      datalist.appendChild(option);
    });

    const input_filter = document.getElementById("filter_id");
    input_filter.addEventListener("input", function () {
      const selectedOption = datalist.querySelector(
        `option[value="${input_filter.value}"]`
      );
      if (selectedOption) {
        input_filter.dataset.input_filter = selectedOption.dataset.filter;
      }
    });
  });

  button_state();
  document
    .getElementById("bcontroler")
    .addEventListener("click", on_of_behavoir);

  document.getElementById("bfilters").addEventListener("click", () => {
    window.open("manager/index.html");
  });
  document.getElementById("bresult").addEventListener("click", () => {
    window.open("results/index.html?id=" + chrome.runtime.id);
  });
  document
    .getElementById("bclear")
    .addEventListener("click", behavior_clear_bt);

  // In your popup or options page
  document.getElementById("bexport").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "export_results" });
  });
  button_main_manager();
}

// ON/OFF behavior
function on_of_behavoir() {
  const val = document.getElementById("filter_id").dataset.regx;
  chrome.runtime.sendMessage(
    {
      action: "controler_request",
      activeRegex: val,
    },
    () => {
      button_state();
    }
  );
}

function button_state() {
  chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
    const object = document.getElementById("bcontroler");

    if (response.message) {
      object.value = "ON";
      object.style.backgroundColor = "#1ABC9C";
      document.getElementById("filter_id").style.display = "none";
      button_main_manager()
    } else {
      object.value = "OFF";
      object.style.backgroundColor = "#95A5A6";
      document.getElementById("filter_id").style.display = "block";
    }
  });
}

function behavior_clear_bt() {
  chrome.runtime.sendMessage({ action: "clear_result" }, () => {});
  button_main_manager();
}

function button_main_manager() {
  chrome.runtime.sendMessage({ action: "is_result_emty" }, (reponse) => {
    if (reponse.status) {
      document.getElementById("bresult").disabled = true;
      document.getElementById("bexport").disabled = true;
      document.getElementById("bclear").disabled = true;
    } else {
      document.getElementById("bresult").disabled = false;
      document.getElementById("bexport").disabled = false;
      document.getElementById("bclear").disabled = false;
    }
  });
}
