const form = document.querySelector(".search");
const input = document.querySelector("#query");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  input.setAttribute("aria-describedby", "search-result");
  let result = document.querySelector("#search-result");
  if (!result) { result = document.createElement("p"); result.id = "search-result"; result.className = "search-note"; form.append(result); }
  result.textContent = input.value.trim() ? "Search is waiting for the first verified source connector." : "Enter a place or business to search the published index.";
});
