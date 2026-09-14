document.addEventListener('DOMContentLoaded',()=>{
  const nav=document.querySelector('#screen-menu .side-bottom') || document.querySelector('#screen-menu .side-nav nav');
  if(!nav || document.querySelector('#screen-menu [data-action="show-install"]')) return;
  const button=document.createElement('button');
  button.className='side-item install-nav-item';
  button.dataset.action='show-install';
  button.type='button';
  button.innerHTML='<span>⬇</span><b>نصب بازی</b>';
  nav.appendChild(button);
});
