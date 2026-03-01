const defaultSelect = document.querySelector('.default-select');
defaultSelect.addEventListener('--select-open',
    () => { console.log('.default-select : open'); });
defaultSelect.addEventListener('--select-close',
    () => { console.log('.default-select : close'); });

const customSelect = document.querySelector('.custom-select');
customSelect.addEventListener('--select-open',
    () => { console.log('.custom-select : open'); });
customSelect.addEventListener('--select-close',
    () => { console.log('.custom-select : close'); });

document.addEventListener('--select-open', (e) => {
    console.log(`Root listener: ${e.target} : open : capture`);
}, { capture: true });

document.addEventListener('--select-close', (e) => {
    console.log(`Root listener: ${e.target} : close : capture`);
}, { capture: true });

document.addEventListener('--select-open', (e) => {
    console.log(`Root listener: ${e.target} : open : bubbling`);
}, { capture: false });

document.addEventListener('--select-close', (e) => {
    console.log(`Root listener: ${e.target} : close : bubbling`);
}, { capture: false });



const button = document.getElementById('add-select');
button.addEventListener('click', () => {
    const selectElement = document.createElement('SELECT');
    document.body.appendChild(selectElement);
})
