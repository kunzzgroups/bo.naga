/* Shared Deep Navy Cyan theme toggle. Key: localStorage bo_theme = light|dark */
(function(global){
  'use strict';
  const THEME_KEY = 'bo_theme';

  function currentTheme(){
    try{ return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; }
    catch(e){ return 'light'; }
  }

  function applyTheme(theme){
    const next = theme === 'dark' ? 'dark' : 'light';
    const isDark = next === 'dark';
    document.documentElement.setAttribute('data-bo-theme', next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    const btn = document.getElementById('boThemeToggle');
    if(!btn) return;
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    const sun = btn.querySelector('[data-theme-icon="sun"]');
    const moon = btn.querySelector('[data-theme-icon="moon"]');
    if(sun) sun.hidden = isDark;
    if(moon) moon.hidden = !isDark;
  }

  function initThemeToggle(){
    applyTheme(currentTheme());
    const btn = document.getElementById('boThemeToggle');
    if(!btn || btn.dataset.boThemeBound === '1') return;
    btn.dataset.boThemeBound = '1';
    btn.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  global.BO_THEME = { currentTheme, applyTheme, initThemeToggle, THEME_KEY };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initThemeToggle);
  }else{
    initThemeToggle();
  }
})(window);
