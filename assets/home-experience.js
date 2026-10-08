/* Keyboard focus and hover pause the announcement without changing content. */
(() => {
 const bar=document.querySelector('.announce');
 if(!bar)return;
 bar.addEventListener('click',()=>bar.classList.toggle('is-paused'));
})();