/**
 * Webflow Attribute Class Suggestion Extension - Content Script
 */

(async () => {
  const scriptUrl = 'https://cdn.jsdelivr.net/gh/Developer-Zahid/Webflow-Attribute-Class-Suggestion-Extension@latest/assets/js/script.min.js';
  
  try {
    // Fetch the script content from the external URL
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.status} ${response.statusText}`);
    }
    const scriptContent = await response.text();

    // Create a new script element and set its content to the fetched script
    const script = document.createElement('script');
    script.textContent = scriptContent;

    // Append the script to the document's head to execute it in the page's context
    (document.head || document.documentElement).appendChild(script);

    // Remove the script tag from the DOM after it has been executed to keep the DOM clean
    script.remove();

  } catch (error) {
    console.error('Error with Webflow Attribute Wizard Helper:', error);
  }
})();