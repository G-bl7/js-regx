console.log("Regex Filter Extension 1.0 running.");

//  Get text From DB
function main() {
  chrome.runtime.sendMessage(
    { action: "get_result"},
    (reponse) => {
      reponse.results.forEach((item) => {
        note = 'saved on API storage';
        let regex = new RegExp(`(${item})`, "gi");
        asyncUnderlineText(document.body, regex, note);
      });
    }
  );
}

// Function to underline text asynchronously
function asyncUnderlineText(node, regex, note) {
  console.log('running for ', regex)
  setTimeout(() => {
    underlineText(node, regex, note);
  }, 0);
}

// Function to underline text
function underlineText(node, regex, note) {
  if (node.nodeType === Node.TEXT_NODE) {
    const matches = node.textContent.match(regex);
    if (matches) {
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      matches.forEach((match) => {
        const matchIndex = node.textContent.indexOf(match, lastIndex);
        fragment.appendChild(
          document.createTextNode(node.textContent.slice(lastIndex, matchIndex))
        );

        const span = document.createElement("span");
        span.className = "saved-note";
        span.title = note;
        span.textContent = match;
        fragment.appendChild(span);

        lastIndex = matchIndex + match.length;
      });

      fragment.appendChild(
        document.createTextNode(node.textContent.slice(lastIndex))
      );
      node.parentNode.replaceChild(fragment, node);
    }
  } else if (
    node.nodeType === Node.ELEMENT_NODE &&
    node.nodeName !== "SCRIPT" &&
    node.nodeName !== "STYLE"
  ) {
    node.childNodes.forEach((child) => underlineText(child, regex, note));
  }
}

main();