import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    display: '',
    power: false,
    strictMode: false
  };

  togglePower = () => {
    this.setState(state => {
      state.power = !state.power;
      state.display = state.power ? '--' : '';
      return state;
    });
  };

  toggleStrict = () => {
    let { power } = this.state;
    if (!power) return;
    this.setState(state => {
      state.strictMode = !state.strictMode;
      return state;
    });
  };

  render() {
    let { power, display, strictMode } = this.state;
    let switchClass = power ? 'switch on' : 'switch';
    let modeClass = strictMode ? 'led-light on' : 'led-light';
    return (
      <div className="App">
        <div className="container">
          <div className="outer-circle">
            <div className="inner-container">
              <div className="game-control">
                <div className="game-name row">
                  <h1>Simon</h1>
                  <span className="copyright">®</span>
                </div>
                <div className="row align-end">
                  <div>
                    <div className="led-display">
                      <div className="led-text">{display}</div>
                    </div>
                    <div className="label">COUNT</div>
                  </div>
                  <div>
                    <div className="push-button red-bg align-center" />
                    <div className="label">START</div>
                  </div>
                  <div>
                    <div className="mode-container align-center">
                      <div className={modeClass} />
                      <div
                        className="push-button"
                        onClick={this.toggleStrict}
                      />
                    </div>
                    <div className="label">STRICT</div>
                  </div>
                </div>
                <div className="switch-container row">
                  <div className="switch-text">OFF</div>
                  <div className={switchClass} onClick={this.togglePower}>
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
