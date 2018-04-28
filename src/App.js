import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="container">
          <div className="outer-circle">
            <div className="inner-container">
              <div className="game-control">
                <div className="row">
                  <h1>Simon</h1>
                  <span className="copyright">®</span>
                </div>
                <div className="row">
                  <div className="led-display">
                    <div className="led-text">111</div>
                  </div>
                  <div className="push-button red-bg" />
                  <div className="push-button" />
                </div>
                <div className="switch-container row">
                  <div className="switch-text">OFF</div>
                  <div className="switch">
                    <div className="switch-button" />
                  </div>
                  <div className="switch-text">ON</div>
                </div>
              </div>
              <div className="row">
                <div className="single-button green" />
                <div className="single-button red" />
              </div>
              <div className="row">
                <div className="single-button yellow" />
                <div className="single-button blue" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
