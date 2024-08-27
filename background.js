let isFilterOn = false;
let activeRegex = "";

// message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message", message);
  switch (message.action) {
    case "controler_request": {
      isFilterOn = !isFilterOn;
      activeRegex = message.activeRegex || "";
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        filter_behavoir({ tabId: tabs[0].id });
      });
      sendResponse({ success: true });
      return true;
    }
    case "getStatus": {
      sendResponse({ success: true, message: isFilterOn });
      return true;
    }
    case "sendResults": {
      chrome.storage.local.get("results", function (result) {
        if (!result.results) {
          result.results = [];
          console.log("old is empty", result.results);
        }

        const uniqueArray = [
          ...new Set([...result.results, ...message.matches]),
        ];
        chrome.storage.local.set({
          results: uniqueArray,
        });
      });
      return true;
    }
    case "get_result": {
      console.log("get your call ", message);
      chrome.storage.local.get("results", (result) => {
        const resultsArray = result.results || [];
        sendResponse({ results: resultsArray });
      });
      return true;
    }
    case "get-regx": {
      chrome.storage.local.get("regx", (result) => {
        const regexList = result.regx || [];

        sendResponse({ regexList });
        return true;
      });
      return true;
    }
    case "export_results": {
      chrome.storage.local.get("results", (result) => {
        const resultsArray = result.results || [];
        const text = resultsArray.join("\n");
        chrome.downloads.download({
          url: "data:application/json," + encodeURIComponent(text),
          filename: "filtered_results.json",
          saveAs: true,
        });
      });
      return true;
    }
    case "is_result_emty": {
      chrome.storage.local.get("results", (result) => {
        const resultsArray = result.results || [];
        if (resultsArray.length === 0) {
          sendResponse({ status: true });
          return true;
        } else {
          sendResponse({ status: false });
        }
      });
      return true;
    }
    case "clear_result": {
      chrome.storage.local.set({ results: [] });
      return true;
    }
    case "delete-regx": {
      const ids = message.ids;
      chrome.storage.local.get("regx", (result) => {
        const regexList = result.regx || [];

        ids.forEach((id) => {
          const index = regexList.findIndex((regex) => regex.id == id);
          if (index !== -1) {
            regexList.splice(index, 1);
          }
        });

        chrome.storage.local.set({ regx: regexList }, () => {
          sendResponse({ success: true });
          return true;
        });
      });
      return true;
    }
    case "add-regx": {
      const { name, pattern } = message;
      chrome.storage.local.get("regx", (result) => {
        const regexList = result.regx || [];
        const newId = regexList.length + 1;
        regexList.push({ id: newId, name, pattern });
        chrome.storage.local.set({ regx: regexList });
        sendResponse({ success: false });
        return true;
      });
      return true;
    }

    default: {
      sendResponse({ success: false });
      return true;
    }
  }
});

// runner script on active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  filter_behavoir(activeInfo);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    filter_behavoir({ tabId: tabId });
  }
});

function filter_behavoir(activeInfo) {
  try {
    if (isFilterOn) {
      chrome.scripting.executeScript({
        target: { tabId: activeInfo.tabId },
        function: applyRegexFilter,
        args: [activeRegex],
      });
    }
  } catch (error) {}
}

function applyRegexFilter(regexPattern) {
  // Create a new regular expression object
  const regex = new RegExp(regexPattern, "g");

  // Match the regex pattern in the text content of the page's body
  const matches = document.body.innerText.match(regex) || [];

  // Send a message to the background script with the matches and the extension ID
  chrome.runtime.sendMessage(
    {
      action: "sendResults",
      matches: matches,
    },
    function (response) {
      // Optional: Handle the response from the background script
      console.log("Response from background:", response);
    }
  );
}
