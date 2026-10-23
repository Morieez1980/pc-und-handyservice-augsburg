(() => {
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  document.querySelectorAll('[data-closure-date]').forEach(notice => {
    notice.hidden = notice.dataset.closureDate !== today;
  });
})();
