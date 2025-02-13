import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import p5 from 'p5';

window.p5 = p5;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);