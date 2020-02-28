import React, { Component } from 'react';
import {IntlProvider} from 'react-intl';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import {Index} from "./pages/Index";
import {DeploymentGroup} from "./pages/DeploymentGroup";


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
          <Router>
            <Switch>
              <Route exact path="/">
                <Index />
              </Route>
              <Route path="/group/:id" render={({match}) => {
                return <DeploymentGroup group={match.params.id} />
              }}>
              </Route>
            </Switch>
          </Router>
        </div>
      </div>
      </IntlProvider>
    );
  }
}

export default App;
