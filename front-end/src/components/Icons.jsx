export function IconLibrary() { return (  <svg className="svg-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sun-fill" x2="0.8" y2="1"><stop stopColor="#ffde88"/><stop offset="1" stopColor="#ffbd52"/></linearGradient>
      <linearGradient id="cloud-fill" x2="0.5" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#dae8f5"/></linearGradient>
    </defs>
    <symbol id="sun" viewBox="0 0 160 160">
      <g stroke="#f4bd57" strokeWidth="4" strokeLinecap="round"><path d="M80 12v12m0 112v12M12 80h12m112 0h12M32 32l9 9m78 78 9 9M32 128l9-9m78-78 9-9"/></g>
      <circle cx="80" cy="80" r="38" fill="url(#sun-fill)"/>
    </symbol>
    <symbol id="cloud" viewBox="0 0 160 160">
      <circle cx="105" cy="53" r="28" fill="url(#sun-fill)"/>
      <path d="M43 122a27 27 0 0 1-2-54 37 37 0 0 1 71-2 28 28 0 0 1 7 56Z" fill="url(#cloud-fill)" stroke="#cfdeec" strokeWidth="1.5"/>
    </symbol>
    <symbol id="pin" viewBox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
    <symbol id="drop" viewBox="0 0 24 24"><path d="M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/></symbol>
    <symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></symbol>
  <symbol id="rain" viewBox="0 0 160 160"><path d="M43 104a27 27 0 0 1-2-54 37 37 0 0 1 71-2 28 28 0 0 1 7 56Z" fill="url(#cloud-fill)" stroke="#cfdeec" strokeWidth="1.5"/><path d="m53 120-7 14m35-14-7 14m35-14-7 14" stroke="#1875b9" strokeWidth="5" strokeLinecap="round"/></symbol>
<symbol id="storm" viewBox="0 0 160 160"><path d="M43 104a27 27 0 0 1-2-54 37 37 0 0 1 71-2 28 28 0 0 1 7 56Z" fill="url(#cloud-fill)" stroke="#cfdeec" strokeWidth="1.5"/><path d="m83 91-19 30h17l-9 25 31-38H86l9-17Z" fill="url(#sun-fill)"/></symbol>
<symbol id="user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></symbol>
<symbol id="lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></symbol>
<symbol id="info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/></symbol>
<symbol id="check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol></svg>); }
export function Icon({ name, className }) {
  const weather = ['sun', 'cloud', 'rain', 'storm'].includes(name);
  return <svg className={className || (weather ? 'weather-icon' : 'icon')} viewBox={weather ? '0 0 160 160' : '0 0 24 24'} aria-hidden="true"><use href={'#' + name} /></svg>;
}