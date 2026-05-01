class FacetBase extends HTMLElement {
  constructor() {
    super();
    this.controller = null;
  }

  abortRequest() {
    if (this.controller) this.controller.abort();
    this.controller = new AbortController();
    return this.controller.signal;
  }

   async fetchAndRender(urlObj) {
    const signal = this.abortRequest();
    const queryInput = document.querySelector('[name="q"]');
    if (queryInput && queryInput.value.trim().length > 0) {
      urlObj.searchParams.set("q", queryInput.value.trim());
      urlObj.searchParams.set("type", "product");
    }
    urlObj.searchParams.set("section_id", this.sectionId);

    fetch(urlObj.toString(), { signal })
    .then(async (res) => {
      const data = await res.text();
      urlObj.searchParams.delete("section_id");
      window.history.replaceState({}, "", urlObj.toString());
      const html = new DOMParser().parseFromString(data, "text/html");

      await this.replaceContent(
        ["collection-grid", "active-filter", "search-result", "price-filter"],
        this.sectionId,
        html
      );

      this.updateFilterItems(html);
      priceRangeFilter();
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Request failed:", error);
      }
    });
  }


  replaceContent(selectors, sectionId, html) {
    selectors.forEach((selector) => {
      const targetSelector = `[data-${selector}-${sectionId}]`;
      const target = document.querySelector(targetSelector);
      const source = html.querySelector(targetSelector);
      if (target && source) {
        target.innerHTML = source.innerHTML;
      }
    });
  }

  updateFilterItems(html) {
    const newFilterItems = html.querySelectorAll(".facets__label");
    const currentFilterItems = document.querySelectorAll(".facets__label");

    currentFilterItems.forEach((item, i) => {
      const newItem = newFilterItems[i];
      if (newItem) item.innerHTML = newItem.innerHTML;
    });
  }

  disconnectedCallback() {
    if (this.controller) this.controller.abort();
  }
}

class FacetFiltersForm extends FacetBase {
  constructor() {
    super();
    this.debouncedOnSubmit = debounce((event) => this.onSubmitHandler(event), 500);
  }

  connectedCallback() {
    this.sectionId = this.dataset.section;
    const facetForm = this.querySelector("form");
    facetForm.addEventListener("input", this.debouncedOnSubmit);
    facetForm.addEventListener("change", this.debouncedOnSubmit);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const params = new URLSearchParams();

    this.querySelectorAll("input:checked, input[type='range']").forEach((input) => {
      params.append(input.name, input.value);
    });
     
    const sortOption = document.querySelector("sort-option")?.getSelectedValue();
    if (sortOption) params.append("sort_by", sortOption);
    
    const urlObj = new URL(window.location.pathname, window.location.origin);
    urlObj.search = params.toString();

    this.fetchAndRender(urlObj);
  }
}

customElements.define("facet-filters-form", FacetFiltersForm);

class FacetRemove extends FacetBase {
  connectedCallback() {
    this.facetLink = this.querySelector("a");
    this.url = this.facetLink?.href;
    this.sectionId = this.closest(".active-facets")?.dataset.sectionId;

    if (this.facetLink) {
      this.facetLink.addEventListener("click", this.removeFilter.bind(this));
    }
  }

  removeFilter(event) {

    event.preventDefault();

    const urlObj = new URL(this.url, window.location.origin);
    this.fetchAndRender(urlObj);
  }
}

customElements.define("facet-remove", FacetRemove);

class SortOption extends FacetBase {
  constructor() {
    super();
    this.debouncedOnSubmit = debounce((event) => this.onSubmitHandler(event), 300);
  }

  connectedCallback() {
    this.sectionId = this.dataset.section;

    this.querySelectorAll("input[type='radio']").forEach((input) => {
      input.addEventListener("change", this.debouncedOnSubmit);
    });
  }

  getSelectedValue() {
    return this.querySelector("input[type='radio']:checked")?.value || null;
  }

  onSubmitHandler(event) {
    const selectedValue = event.target.value;

    const params = new URLSearchParams(window.location.search);
    params.set("sort_by", selectedValue);
        
    this.querySelectorAll("input[type='radio']").forEach((input) => {
      input.removeAttribute('checked');
      if(input.value == selectedValue){
        input.setAttribute('checked','');
      }
    });
    
    const urlObj = new URL(window.location.pathname, window.location.origin);
    urlObj.search = params.toString();

    const sort_btn = this.closest('.sort-wrapper').querySelector('.sort-btn');
    sort_btn.dispatchEvent(new Event('click', { bubbles: true }));
    
    this.fetchAndRender(urlObj);
  }
}

customElements.define("sort-option", SortOption);

function priceRangeFilter() {
  const rangeInput = document.querySelectorAll(".range-input input"),
        minPriceDisplay = document.querySelector(".min-price-display"),
        maxPriceDisplay = document.querySelector(".max-price-display"),
        range = document.querySelector(".input-slider .input-progress"),
        minRange = rangeInput[0],
        maxRange = rangeInput[1];

  if (!rangeInput.length || !minRange || !maxRange) return;

  function updateSliderTrack(minVal, maxVal) { 
    range.style.left = (minVal / minRange.max) * 100 + "%";
    range.style.right = 100 - (maxVal / maxRange.max) * 100 + "%";
  }

  let minVal = parseInt(minRange.value),
      maxVal = parseInt(maxRange.value);

    console.log('minVal',minVal);
    console.log('maxVal',maxVal);

  updateSliderTrack(minVal, maxVal);
  minPriceDisplay.textContent = minVal;
  maxPriceDisplay.textContent = maxVal;

  minRange.addEventListener("input", () => {
    minVal = parseInt(minRange.value);
    maxVal = parseInt(maxRange.value);
    if (minVal > maxVal) minRange.value = maxVal;
    minPriceDisplay.textContent = minRange.value;
    updateSliderTrack(minVal, maxVal);
  });

  maxRange.addEventListener("input", () => {
    minVal = parseInt(minRange.value);
    maxVal = parseInt(maxRange.value);
    if (maxVal < minVal) maxRange.value = minVal;
    maxPriceDisplay.textContent = maxRange.value;
    updateSliderTrack(minVal, maxVal);
  });
}

priceRangeFilter();