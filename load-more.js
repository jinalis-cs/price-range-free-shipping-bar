// https://dte2dc-ra.myshopify.com/

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".load-more");
  if (!btn) return;

  e.preventDefault();

  const url = btn.getAttribute("href");
  if (!url) return;

  btn.innerText = "Loading...";
  btn.style.pointerEvents = "none";

  fetch(url)
    .then(res => res.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, "text/html");

      let newItems = doc.querySelectorAll("#ProductGridContainer .product-grid-wpr > *");
      let container = document.querySelector("#ProductGridContainer .product-grid-wpr");

      if (!newItems.length) {
        newItems = doc.querySelectorAll(".collection_grid > *");
        container = document.querySelector(".collection_grid");
      }

      if (!container) return;

      newItems.forEach(el => container.appendChild(el));

      const newBtnWrapper = doc.querySelector(".lodeMore-btn-wpr");
      const oldBtnWrapper = document.querySelector(".lodeMore-btn-wpr");

      if (newBtnWrapper) {
        oldBtnWrapper.replaceWith(newBtnWrapper);
      } else if (oldBtnWrapper) {
        oldBtnWrapper.remove();
      }
    })
    .catch(() => {
      btn.innerText = "LOAD MORE";
      btn.style.pointerEvents = "auto";
    });
});
