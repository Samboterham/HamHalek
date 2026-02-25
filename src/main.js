import '../style.css';
import { renderApp } from './ui.js';
import { subscribe, loadData } from './store.js';

// Subscribe to state changes to re-render
subscribe(() => {
  renderApp();
});

// Initial render (shows loading state)
renderApp();

// Load data from the database
loadData();
