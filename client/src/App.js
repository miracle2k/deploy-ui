import React, { Component } from 'react';
import {IntlProvider} from 'react-intl';
import logo from './logo.svg';
import './App.css';
import Deployment from './Deployment';


class App extends Component {
  render() {
    return (
      <IntlProvider
       locale={"en"}
      >
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Deploy UI</h1>
        </header>
        <div className="App-content">
          <Deployment name="ordersys-website/ordersys-website" />
          <Deployment name="emojigram/emojigram" />
          <Deployment name="kube-system/deploy-ui" />
          <Deployment name="languagetool/farsi-school" />
        </div>
      </div>
      </IntlProvider>
    );
  }
}

export default App;
