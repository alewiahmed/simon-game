import React, { Component } from 'react';
import { Subject, from, timer } from 'rxjs';
import { map, take, timeout, zip } from 'rxjs/operators';

import './App.css';

class App extends Component {
  state = {
    display: '',
    power: false,
    sequence: [],
    strictMode: false,
    playEnabled: false,
    buttonSelected: [false, false, false, false]
  };

  togglePower = () => {
    let { power } = this.state;
    if (power) {
      this.clearEverything();
    } else {
      this.setState({
        power: true,
        display: '--'
      });
    }
  };

  listenToSequence = () => {
    this.setState({
      playEnabled: true
    });
    let { sequence } = this.state;
    this.pushSubject = new Subject();
    let pushObservable = from(sequence).pipe(
      zip(this.pushSubject),
      timeout(3000)
    );
    this.pushSubscription = pushObservable.subscribe({
      next: value => {
        if (value[0] !== value[1]) {
          this.gameOver();
        }
      },
      complete: () => {
        this.newGame();
      },
      error: () => {
        this.gameOver();
      }
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

  mouseDownHandler = id => {
    let { playEnabled } = this.state;
    this.selectButton(id);
  };

  mouseUpHandler = id => {
    let { playEnabled } = this.state;
    this.deSelectButton(id);
    this.pushSubject.next(id);
  };

  clearEverything = () => {
    if (this.pushSubscription) this.pushSubscription.unsubscribe();
    this.setState({
      display: '',
      power: false,
      sequence: [],
      strictMode: false,
      playEnabled: false,
      buttonSelected: [false, false, false, false]
    });
  };

  clearGame = callback => {
    if (this.pushSubscription) this.pushSubscription.unsubscribe();
    this.setState(
      {
        display: '',
        sequence: [],
        playEnabled: false,
        buttonSelected: [false, false, false, false]
      },
      callback
    );
  };

  playTone = (id, time) => {
    this.selectButton(id);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.deSelectButton(id);
        resolve(true);
      }, time);
    });
  };

  playSequence = async () => {
    let { sequence } = this.state;
    if (!sequence.length) return;
    let time = 500 + 1000 / sequence.length;
    let sequenceRx = from(sequence);
    let intervalRx = timer(0, time + 500).pipe(take(sequence.length));
    sequenceRx = sequenceRx.pipe(zip(intervalRx), map(value => value[0]));
    sequenceRx.subscribe({
      next: value => {
        this.playTone(value, time);
      },
      complete: () => {
        setTimeout(() => {
          this.listenToSequence();
        }, 500 + time);
      }
    });
  };

  addToSequence = () => {
    let random = Math.floor(Math.random() * 4);
    this.setState(state => {
      state.sequence.push(random);
      return state;
    }, this.playSequence);
  };

  newGame = () => {
    this.setState({
      playEnabled: false
    });
    setTimeout(() => {
      this.addToSequence();
    }, 1300);
  };

  startNew = () => {
    let { power } = this.state;
    if (!power) return;
    this.clearGame(this.newGame);
  };

  replayGame = () => {
    let { strictMode } = this.state;
    if (strictMode) this.startNew();
    else {
      this.setState(
        {
          display: ''
        },
        this.playSequence
      );
    }
  };

  gameOver = () => {
    this.pushSubscription.unsubscribe();
    this.setState(
      {
        display: '!!',
        playEnabled: false
      },
      () => {
        setTimeout(() => {
          this.replayGame();
        }, 3000);
      }
    );
  };

  selectButton = id => {
    this.setState(state => {
      state.buttonSelected[id] = true;
      return state;
    });
  };

  deSelectButton = id => {
    this.setState(state => {
      state.buttonSelected[id] = false;
      return state;
    });
  };

  showButtons = () => {
    let { buttonSelected, playEnabled } = this.state;
    let buttons = ['green', 'red', 'yellow', 'blue'];
    let elements = [],
      row = [],
      selected = '',
      enabled = '';
    buttons.forEach((button, index) => {
      selected = buttonSelected[index] ? 'selected' : '';
      enabled = playEnabled ? 'enabled' : '';
      row.push(
        <div
          key={index}
          onMouseUp={() => this.mouseUpHandler(index)}
          onMouseDown={() => this.mouseDownHandler(index)}
          className={`single-button ${buttons[index]} ${selected} ${enabled}`}
        />
      );
      if ((index + 1) % 2 == 0) {
        elements.push(
          <div className="row" key={index}>
            {row}
          </div>
        );
        row = [];
      }
    });
    return elements;
  };

  showDisplay = () => {
    let { display, sequence, power } = this.state;
    if (!power) return;
    if (display !== '') return display;
    return sequence.length < 10 ? `0${sequence.length}` : sequence.length;
  };

  render() {
    let { power, strictMode } = this.state;
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
                      <div className="led-text">{this.showDisplay()}</div>
                    </div>
                    <div className="label">COUNT</div>
                  </div>
                  <div>
                    <div
                      onClick={this.startNew}
                      className="push-button red-bg align-center"
                    />
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
              {this.showButtons()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
