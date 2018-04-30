import React, { Component } from 'react';
import { Subject, from, timer } from 'rxjs';
import { map, take, timeout, zip } from 'rxjs/operators';

import './App.css';

class App extends Component {
  state = {
    sounds: [],
    display: '',
    power: false,
    sequence: [],
    strictMode: false,
    playEnabled: false,
    frequencies: [327.25, 493.88, 440.0, 392.0],
    buttonSelected: [false, false, false, false]
  };

  componentDidMount() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
  }

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
    this.selectButton(id);
  };

  mouseUpHandler = id => {
    this.deSelectButton(id);
    if (this.pushSubject) this.pushSubject.next(id);
  };

  clearEverything = () => {
    this.clearTimers();
    this.clearSubscriptions();
    this.stopEverySound();
    this.setState({
      display: '',
      sounds: [],
      power: false,
      sequence: [],
      strictMode: false,
      playEnabled: false,
      buttonSelected: [false, false, false, false]
    });
  };

  clearGame = callback => {
    this.clearTimers();
    this.clearSubscriptions();
    this.stopEverySound();
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

  clearTimers = () => {
    clearTimeout(this.listenTimeout);
    clearTimeout(this.replayTimeout);
    clearTimeout(this.sequenceTimeout);
    clearTimeout(this.playButtonTimeout);
  };

  clearSubscriptions = () => {
    if (this.pushSubscription) this.pushSubscription.unsubscribe();
    if (this.sequenceSubscription) this.sequenceSubscription.unsubscribe();
  };

  stopEverySound = () => {
    let { sounds } = this.state;
    sounds.forEach((sound, index) => {
      if (sound) this.stopSound(index);
    });
  };

  playButton = (id, time) => {
    this.selectButton(id);
    return new Promise((resolve, reject) => {
      this.playButtonTimeout = setTimeout(() => {
        this.deSelectButton(id);
        resolve(true);
      }, time);
    });
  };

  getSequenceTime = length => {
    let times = [1000, 800, 600, 400];
    if (length < 3) return times[0];
    else if (length < 6) return times[1];
    else if (length < 9) return times[2];
    else return times[3];
  };

  playSequence = async () => {
    let { sequence } = this.state;
    if (!sequence.length) return;
    let time = this.getSequenceTime(sequence.length);
    let sequenceRx = from(sequence);
    let intervalRx = timer(0, time + 300).pipe(take(sequence.length));
    sequenceRx = sequenceRx.pipe(zip(intervalRx), map(value => value[0]));
    this.sequenceSubscription = sequenceRx.subscribe({
      next: value => {
        this.playButton(value, time);
      },
      complete: () => {
        this.listenTimeout = setTimeout(() => {
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
    this.sequenceTimeout = setTimeout(() => {
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
    this.clearSubscriptions();
    this.setState(
      {
        display: '!!',
        playEnabled: false
      },
      () => {
        this.replayTimeout = setTimeout(() => {
          this.replayGame();
        }, 3000);
      }
    );
  };

  selectButton = id => {
    this.playSound(id);
    this.setState(state => {
      state.buttonSelected[id] = true;
      return state;
    });
  };

  deSelectButton = id => {
    this.stopSound(id);
    this.setState(state => {
      state.buttonSelected[id] = false;
      return state;
    });
  };

  playSound = id => {
    let { frequencies, sounds } = this.state;
    let note = sounds[id];
    if (!note) note = new Sound(this.audioContext);
    this.setState(state => {
      state.sounds[id] = note;
      return state;
    });
    let now = this.audioContext.currentTime;
    note.play(frequencies[id], now);
  };

  stopSound = id => {
    let { sounds } = this.state;
    let now = this.audioContext.currentTime;
    if (sounds[id]) sounds[id].stop(now);
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

class Sound {
  constructor(context) {
    this.context = context;
  }

  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = 'sine';
  }

  play(value, time) {
    this.init();

    this.oscillator.frequency.value = value;
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      0.5,
      this.context.currentTime + 0.001
    );
    this.oscillator.start(time);
  }

  stop(time) {
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1);
    this.oscillator.stop(time + 1);
  }
}

export default App;
