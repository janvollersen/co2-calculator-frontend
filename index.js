import React from 'react'; // imports react library, necessary to use react
import ReactDOM from 'react-dom'; // imports reactDOM libary, necessary to use react
import './index.css'; // imports style page
import App from './App'; // imports App.js, whihc contains webapp content
import * as serviceWorker from './serviceWorker'; // imports serviceWorker, for managing routing

// This file renders the app to the page. See './App.js'
ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
