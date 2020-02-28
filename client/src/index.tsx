import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

(window as any).BACKEND_URL = '/api';

ReactDOM.render(<App />, document.getElementById('root'));
