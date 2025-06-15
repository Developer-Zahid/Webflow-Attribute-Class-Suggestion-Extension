// Inject custom styles for "wf-custom-class-card"
const style = document.createElement("style");
style.innerHTML = `
.wf-custom-class-card {
    grid-column: 2 / -1;
    padding: 5px 5px 2px;
    border: 1px solid var(--colors-border-2);
    border-radius: 4px;
    color: var(--colors-text-primary);
    box-shadow: var(--box-shadows-input-inner);
    background-color: var(--colors-background-1);
    margin-top: -34px;
}
.wf-custom-class__search {
	display: block;
    width: 100%;
    min-width: 0;
    margin-bottom: 6px;
    padding: 3px 6px;
    border: 1px solid var(--colors-border-3);
    border-radius: 4px;
    color: var(--colors-text-primary);
    background-color: var(--colors-ui-input-background);
    box-shadow: var(--box-shadows-input-inner);
    font: inherit;
    outline: none;
}
.wf-custom-class__search:focus {
    border-color: var(--colors-blue-border);
}
.wf-custom-class__list {
    list-style-type: '';
    max-height: 194px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    line-height: 1.9;
    color-scheme: light dark;
}
.wf-custom-class__list__item ~ .wf-custom-class__list__item {
    margin-top: 2px;
}
.wf-custom-class__list__button {
    display: block;
    cursor: pointer;
    padding: 2px 22px 2px 6px;
    border: none;
    border-radius: 3px;
    color: var(--colors-text-primary);
    background-color: transparent;
    width: 100%;
    text-align: left;
    outline: none;
    background-repeat: no-repeat;
    background-position: calc(100% - 3px) center;
    background-size: 16px;
}
.wf-custom-class__list__button:is(:hover, :focus-visible) {
    color: var(--colors-action-secondary-text);
    background-color: var(--colors-ui-background-hover);
}
.wf-custom-class__list__button:active {
    background-color: var(--colors-ui-background-active);
}
.wf-custom-class__list__button.active {
    color: var(--colors-action-primary-text);
    background-color: var(--colors-action-primary-background);
}
.wf-custom-class__list__button.active:is(:hover, :focus-visible) {
    background-color: var(--colors-action-primary-background-hover);
	background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 1C-1.25 1.3 -1.25 14.7 8 15C17.25 14.7 17.25 1.3 8 1Z' fill='%23F44336'/%3E%3Cpath d='M8.70001 7.99974L10.8 5.89974C11.25 5.44974 10.55 4.74974 10.1 5.19974L8.00001 7.29974L5.90001 5.19974C5.45001 4.74974 4.75001 5.44974 5.20001 5.89974L7.30001 7.99974L5.20001 10.0997C4.75001 10.5497 5.45001 11.2497 5.90001 10.7997L8.00001 8.69974L10.1 10.7997C10.55 11.2497 11.25 10.5497 10.8 10.0997L8.70001 7.99974Z' fill='white'/%3E%3C/svg%3E");
}
.wf-custom-class__list__button.active:active {
    background-color: var(--colors-red-background-pressed);
}
`;
document.head.appendChild(style);

// Get the target input for setting class
function getCustomClassAttrInputElement() {
	return (
		document.querySelector('[data-automation-id^="Type--Plugin_Text"][value="class"]')
            ?.closest('[data-automation-id^="ExpressionEditor-fieldWrapper-"]')
			?.parentElement?.querySelector('[data-automation-id="ExpressionEditor-fieldWrapper-value" i]')
			?.querySelector('[data-automation-id^="Type--Plugin_Text"]') || null
	);
}

function normalizeClassName(name) {
	return name
		.toLowerCase()
		.replace(/^_+/g, "") // remove leading underscores
		.replace(/[^a-z0-9_]+/g, "-") // replace special chars/spaces (but not _) with hyphen
		.replace(/^-+/, "") // remove leading hyphens
		.replace(/^\d/, (match) => `_${match}`) // prefix if starting with digit
		.replace(/-+/g, "-"); // collapse multiple hyphens
}

function normalizeForSearch(str) {
	if (!str) return "";
	return str.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Read classes from Webflow's internal store
function getWebflowClasses() {
	const classNames = [];
	const blocks = window._webflow?.stores?.StyleBlockStore?.state?.styleBlocks || [];

	blocks
		.filter((block) => block.get("type") === "class")
		.map((classBlock) => {
			const rawName = classBlock.get("name");
			const normalized = normalizeClassName(rawName);
			classNames.push(normalized);
		});

	return [...new Set(classNames)]; // Remove duplicates
}

// Set value with React-compatible trigger
function updateCustomClassAttrValue(className) {
	const input = getCustomClassAttrInputElement();
	if (input) {
		const nativeSetter = Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value"
		).set;
		nativeSetter.call(input, className);
		input.dispatchEvent(new Event("input", { bubbles: true }));
		input.dispatchEvent(new Event("change", { bubbles: true }));
	}
}

// Show class list on focus
function renderClassList(targetInput) {
	const currentValue = targetInput.value.trim();
	const currentClasses = currentValue ? currentValue.split(/\s+/) : [];

	const classNames = getWebflowClasses();

	const sortedClassNames = [
		...currentClasses,
		...classNames.filter((c) => !currentClasses.includes(c)),
	];

	const existingListWrapper = document.querySelector(
		".wf-custom-class-card"
	);
	if (existingListWrapper) existingListWrapper.remove();

	// Wrapper div
	const wrapper = document.createElement("div");
	wrapper.className = "wf-custom-class-card";

	// Search input
	const searchInput = document.createElement("input");
	searchInput.setAttribute("type", "text");
	searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("autocorrect", "off");
    searchInput.setAttribute("autocapitalize", "off");
    searchInput.setAttribute("spellcheck", "false");
    searchInput.setAttribute("name", "Search_Class");
    searchInput.setAttribute("aria-label", "Search classes");
	searchInput.setAttribute("placeholder", "Search classes…");
	searchInput.className = "wf-custom-class__search";

	// List
	const list = document.createElement("ul");
	list.className = "wf-custom-class__list";
	list.setAttribute("tabindex", "-1");

	// Store buttons for filtering later
	const buttons = [];

	sortedClassNames.forEach((className) => {
		const item = document.createElement("li");
		item.className = "wf-custom-class__list__item";

		const button = document.createElement("button");
		button.className = "wf-custom-class__list__button";
		button.setAttribute("type", "button");
		button.textContent = className;

		const isActive = currentClasses.includes(className);
		if (isActive) button.classList.add("active");

		button.addEventListener("click", () => {
			const input = getCustomClassAttrInputElement();
			if (!input) return;

			let current = input.value.trim().split(/\s+/).filter(Boolean);
			const index = current.indexOf(className);

			if (index > -1) {
				current.splice(index, 1);
			} else {
				current.unshift(className);
			}

			updateCustomClassAttrValue(current.join(" "));
			renderClassList(input);
		});

		item.appendChild(button);
		list.appendChild(item);
		buttons.push({ className, item });
	});

	searchInput.addEventListener("input", () => {
		const search = searchInput.value;
		// Normalize the search input
		const normalizedSearch = normalizeForSearch(search);

		buttons.forEach(({ className, item }) => {
			// Normalize the class name before comparing
			const normalizedClassName = normalizeForSearch(className);
			const match = normalizedClassName.includes(normalizedSearch);
			item.style.display = match ? "" : "none";
		});
	});

	wrapper.appendChild(searchInput);
	wrapper.appendChild(list);
	targetInput.parentNode.appendChild(wrapper);

    setTimeout(() => searchInput.focus(), 0);
	setTimeout(() => (list.scrollTop = 0), 0);
}

function observeInputChanges(input) {
	input.addEventListener("input", () => {
		renderClassList(input);
	});
}

document.addEventListener(
	"focus",
	function (event) {
		const targetInput = getCustomClassAttrInputElement();
		if (event.target === targetInput) {
			renderClassList(targetInput);
			observeInputChanges(targetInput);
		}
	},
	true
);

console.log("Webflow Attribute Class Suggestion Injected");