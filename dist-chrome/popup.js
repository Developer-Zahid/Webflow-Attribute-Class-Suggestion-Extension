/*

document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('extension-toggle');
  const toggleLabel = document.getElementById('toggle-label');
  const unsavedAlert = document.getElementById('unsaved-alert');

  // --- Reusable Functions ---

  function getWebflowSaveStatus() {
    return window._webflow?.stores?.ServerSyncStore?.state?.masterStatus;
  }

  function setExtensionState(isEnabled) {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ extensionEnabled: isEnabled });
    }
    updateLabel(isEnabled);
  }

  function updateLabel(isEnabled) {
    if (toggleLabel) {
      toggleLabel.textContent = isEnabled ? 'Extension is Active' : 'Extension is Inactive';
    }
  }

  function showAlert(message) {
    if (unsavedAlert) {
      unsavedAlert.textContent = message;
      unsavedAlert.style.display = 'block';
    }
  }

  function hideAlert() {
    if (unsavedAlert) {
      unsavedAlert.style.display = 'none';
    }
  }

  // Refactored function to check status on the active tab
  function checkUnsavedChanges(callback) {
    if (!window.chrome?.tabs) {
      callback(null); // Cannot check, proceed as if no changes
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id || !activeTab?.url) {
        callback(null); // Not a valid tab
        return;
      }

      let isWebflowPage = false;
      try {
        const url = new URL(activeTab.url);
        isWebflowPage = url.hostname === 'webflow.com' || url.hostname.endsWith('.design.webflow.com');
      } catch (error) {
        console.log('Could not parse URL, unsaved changes check disabled.', error);
        callback(null);
        return;
      }

      if (!isWebflowPage) {
        callback(null); // Not a webflow page
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: getWebflowSaveStatus,
          world: 'MAIN',
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error(`Script injection failed: ${chrome.runtime.lastError.message}`);
            callback(null); // Injection failed
            return;
          }
          callback(injectionResults?.[0]?.result);
        }
      );
    });
  }

  // --- Main Logic ---

  // 1. Initial setup on popup open
  function initializePopup() {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get({ extensionEnabled: true }, (result) => {
        toggleSwitch.checked = result.extensionEnabled;
        updateLabel(result.extensionEnabled);
      });
    }

    checkUnsavedChanges((saveStatus) => {
      if (saveStatus && saveStatus !== 'saved') {
        showAlert('You have unsaved changes.');
      } else {
        hideAlert();
      }
    });
  }

  // 2. Handle toggle switch changes
  toggleSwitch.addEventListener('change', (event) => {
    if (event.target.checked) {
      setExtensionState(true);
      hideAlert();
      return;
    }

    // User is trying to disable, check for unsaved changes.
    checkUnsavedChanges((saveStatus) => {
      if (saveStatus && saveStatus !== 'saved') {
        toggleSwitch.checked = true; // Revert UI
        updateLabel(true); // Revert label
        showAlert('You have to wait until save changes in Webflow before deactivating.');
      } else {
        // All clear, proceed with deactivation.
        setExtensionState(false);
        hideAlert();
      }
    });
  });

  // Run initialization
  initializePopup();
});

*/

document.addEventListener('DOMContentLoaded', () => {
  // Since the popup is disabled on non-Webflow pages by the background script,
  // we can assume this code only runs when on a Webflow designer page.
  const toggleSwitch = document.getElementById('extension-toggle');
  const toggleLabel = document.getElementById('toggle-label');
  const unsavedAlert = document.getElementById('unsaved-alert');

  // --- Reusable Functions ---

  function getWebflowSaveStatus() {
    return window._webflow?.stores?.ServerSyncStore?.state?.masterStatus;
  }

  function setExtensionState(isEnabled) {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ extensionEnabled: isEnabled });
    }
    updateLabel(isEnabled);
  }

  function updateLabel(isEnabled) {
    if (toggleLabel) {
      toggleLabel.textContent = isEnabled ? 'Extension is Active' : 'Extension is Inactive';
    }
  }

  function showAlert(message) {
    if (unsavedAlert) {
      unsavedAlert.textContent = message;
      unsavedAlert.style.display = 'block';
    }
  }

  function hideAlert() {
    if (unsavedAlert) {
      unsavedAlert.style.display = 'none';
    }
  }

  // Refactored function to check status on the active tab
  function checkUnsavedChanges(callback) {
    if (!window.chrome?.tabs) {
      callback(null); // Cannot check, proceed as if no changes
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        callback(null); // Not a valid tab
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: getWebflowSaveStatus,
          world: 'MAIN',
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error(`Script injection failed: ${chrome.runtime.lastError.message}`);
            callback(null); // Injection failed
            return;
          }
          callback(injectionResults?.[0]?.result);
        }
      );
    });
  }

  // --- Main Logic ---

  // 1. Initial setup on popup open
  function initializePopup() {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get({ extensionEnabled: true }, (result) => {
        toggleSwitch.checked = result.extensionEnabled;
        updateLabel(result.extensionEnabled);
      });
    }

    checkUnsavedChanges((saveStatus) => {
      if (saveStatus && saveStatus !== 'saved') {
        showAlert('You have unsaved changes.');
      } else {
        hideAlert();
      }
    });
  }

  // 2. Handle toggle switch changes
  toggleSwitch.addEventListener('change', (event) => {
    if (event.target.checked) {
      setExtensionState(true);
      hideAlert();
      return;
    }

    // User is trying to disable, check for unsaved changes.
    checkUnsavedChanges((saveStatus) => {
      if (saveStatus && saveStatus !== 'saved') {
        toggleSwitch.checked = true; // Revert UI
        updateLabel(true); // Revert label
        showAlert('You have to wait until save changes in Webflow before deactivating.');
      } else {
        // All clear, proceed with deactivation.
        setExtensionState(false);
        hideAlert();
      }
    });
  });

  // Run initialization
  initializePopup();
});