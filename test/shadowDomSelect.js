class ShadowDomSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <select>
        <option value="timmy">Timmy</option>
        <option value="tummy">Tummy</option>
        <option value="tommy">Tommy</option>
      </select>
      <div></div>
    `;
  }
}

customElements.define('shadow-dom-select', ShadowDomSelect);