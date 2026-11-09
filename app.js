const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const results = document.querySelector("#search-results");
const menuButton = document.querySelector(".nav-button");
const nav = document.querySelector("#primary-nav");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim().slice(0, 120);
  results.hidden = false;
  results.replaceChildren();
  if (!query) {
    results.textContent = "Enter a source or jurisdiction to search.";
    input.focus();
    return;
  }
  results.textContent = "Searching the verified source registry…";
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Search unavailable");
    const data = await response.json();
    results.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = data.sources.length ? `Source matches (${data.sources.length})` : "No source matches";
    const description = document.createElement("p");
    description.textContent = data.records.length
      ? `${data.records.length} verified published records match. No safety conclusion is inferred.`
      : "No published inspection records match. Missing records are not evidence of safety.";
    results.append(heading, description);
    for (const source of data.sources) {
      const item = document.createElement("p");
      item.className = "result-source";
      item.textContent = `${source.authority} · ${source.jurisdiction} · access ${source.access}`;
      results.append(item);
    }
  } catch {
    results.textContent = "Search is temporarily unavailable. The published coverage statement remains unchanged.";
  }
});

menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  nav.classList.toggle("is-open", !expanded);
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});
