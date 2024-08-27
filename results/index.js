document.addEventListener("DOMContentLoaded", main);

function main() {
  const urlParams = new URLSearchParams(window.location.search);
  const extensionId = urlParams.get('id');
  const pparent = document.getElementById('id_container_result');
  chrome.runtime.sendMessage(extensionId, { action: "get_result" }, (response) => {
    const resultsArray = response.results;
    resultsArray.forEach((element, index) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = ` ${index + 1}./ ${element !== undefined ? element : 'undefined'}`;
      pparent.appendChild(paragraph);
    });
  });
}