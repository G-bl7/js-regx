chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    // Set default regex pattern for IP addresses
    const defaultRegex = [
      {
        id: 1,
        name: "IP Address",
        pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b",
      },
      {
        id: 2,
        name: "Domain Name/url",
        pattern: "(www.)?([a-zA-Z0-9.-]+.[a-zA-Z]{2,})/?",
      },
    ];
    chrome.storage.local.set({ regx: defaultRegex });
  }
});

let isFilterOn = false;
let activeRegex = "";
// message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.action.setBadgeBackgroundColor({ color: "#95c456" }); // Optional: set badge background color to red

  console.log("background message", message);
  switch (message.action) {
    case "controler_request": {
      isFilterOn = !isFilterOn;
      
      if (isFilterOn) {
        
        chrome.action.setIcon({
          path: {
            16: "images/icon16-up.png",
            48: "images/icon48-up.png",
            128: "images/icon128-up.png",
          },
        });
      } else {
        chrome.action.setIcon({
          path: {
            16: "images/icon16-down.png",
            48: "images/icon48-down.png",
            128: "images/icon128-down.png",
          },
        });
      }
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

        chrome.storage.local.set(
          {
            results: uniqueArray,
          },
          () => {
            chrome.action.setBadgeText({ text: "" + uniqueArray.length });
          }
        );
      });
      sendResponse({ success: true });
      return true;
    }
    case "get_result": {
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
          filename: "filtered_results.txt",
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
      chrome.action.setBadgeText({ text: "" });
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
  console.log("In use:", regexPattern);
  const regex = new RegExp(regexPattern, "g");
  const matches = [];
  const batchSize = 20; // adjust this value to control batch size
  const throttleTimeout = 100; // adjust this value to control throttle timeout

  // Create a function to process batches of matches
  function processBatch() {
    const batch = matches.splice(0, batchSize);
    chrome.runtime.sendMessage({
      action: "sendResults",
      matches: batch,
    });
    if (matches.length > 0) {
      setTimeout(processBatch, throttleTimeout);
    }
  }

  // Match the regex pattern in the text content of the page's body
  const textContent = document.body.innerText;
  let match;
  while ((match = regex.exec(textContent)) !== null) {
    matches.push(match[0]);
  }

  // Process the matches in batches
  processBatch();
}
