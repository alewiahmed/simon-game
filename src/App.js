import React, { Component } from 'react';
import { Subject, from, timer } from 'rxjs';
import { map, take, timeout, zip } from 'rxjs/operators';

import './App.css';

class App extends Component {
  state = {
    sounds: [],
    power: false,
    sequence: [],
    display: null,
    strictMode: false,
    playEnabled: false,
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
    this.releaseSubject = new Subject();
    let pushObservable = from(sequence).pipe(
      zip(this.pushSubject),
      timeout(3000)
    );

    this.releaseSubscription = this.releaseSubject.subscribe({
      next: value => {
        this.deSelectButton(value);
        this.stopSound(value);
      }
    });
    this.pushSubscription = pushObservable.subscribe({
      next: value => {
        this.selectButton(value[1]);
        if (value[0] !== value[1]) this.gameOver();
        else this.playSound(value[0]);
      },
      complete: () => {
        if (sequence.length === 20) this.anounceWin();
        else this.newGame();
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
    if (this.pushSubject) this.pushSubject.next(id);
  };

  mouseUpHandler = id => {
    if (this.releaseSubject) this.releaseSubject.next(id);
  };

  clearEverything = () => {
    this.clearTimers();
    this.clearSubscriptions();
    this.stopEverySound();
    this.setState({
      sounds: [],
      power: false,
      sequence: [],
      display: null,
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
        sequence: [],
        playEnabled: false,
        buttonSelected: [false, false, false, false]
      },
      callback
    );
  };

  clearTimers = () => {
    clearTimeout(this.winTimeout);
    clearTimeout(this.listenTimeout);
    clearTimeout(this.replayTimeout);
    clearTimeout(this.sequenceTimeout);
    clearTimeout(this.playButtonTimeout);
  };

  clearSubscriptions = () => {
    if (this.releaseSubject) this.releaseSubject.unsubscribe();
    if (this.pushSubscription) this.pushSubscription.unsubscribe();
    if (this.blinkSubscription) this.blinkSubscription.unsubscribe();
    if (this.sequenceSubscription) this.sequenceSubscription.unsubscribe();
    if (this.blinkButtonSubscription)
      this.blinkButtonSubscription.unsubscribe();
  };

  stopEverySound = () => {
    let { sounds } = this.state;
    sounds.forEach((sound, index) => {
      if (sound) this.stopSound(index);
    });
  };

  playButton = (id, time) => {
    this.selectButton(id);
    this.playSound(id);
    return new Promise((resolve, reject) => {
      this.playButtonTimeout = setTimeout(() => {
        this.deSelectButton(id);
        this.stopSound(id);
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
    this.clearTimers();
    this.sequenceTimeout = setTimeout(() => {
      this.setState(
        {
          display: null,
          playEnabled: false,
          buttonSelected: [false, false, false, false]
        },
        () => {
          this.stopEverySound();
          this.clearSubscriptions();
          this.addToSequence();
        }
      );
    }, 2000);
  };

  startNew = () => {
    let { power } = this.state;
    if (!power) return;
    this.clearGame(this.newGame);
    this.showBlinkingMessage('--', 2);
  };

  replayGame = () => {
    let { strictMode } = this.state;
    this.replayTimeout = setTimeout(() => {
      if (strictMode) this.startNew();
      else {
        this.setState(
          {
            display: null
          },
          this.playSequence
        );
      }
    }, 3000);
  };

  showBlinkingMessage = (message, num) => {
    let blinkRx = timer(0, 250).pipe(take(num * 2));

    this.blinkSubscription = blinkRx.subscribe({
      next: value => {
        if (value % 2 === 0) {
          this.setState({
            display: ''
          });
        } else {
          this.setState({
            display: message
          });
        }
      }
    });
  };

  showBlinkingButton = (id, num) => {
    let blinkRx = timer(0, 75).pipe(take(num * 2));

    this.blinkButtonSubscription = blinkRx.subscribe({
      next: value => {
        if (value % 2 === 0) {
          this.playSound(id);
          this.selectButton(id);
        } else {
          this.deSelectButton(id);
          this.stopSound(id);
        }
      }
    });
  };

  gameOver = () => {
    this.clearSubscriptions();
    this.playErrorSound();
    this.stopEverySound();
    setTimeout(() => {
      this.setState({
        buttonSelected: [false, false, false, false]
      });
    }, 1500);
    this.setState(
      {
        playEnabled: false
      },
      () => {
        this.showBlinkingMessage('!!', 3);
        this.replayGame();
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

  playSound = id => {
    let { sounds } = this.state;
    let note = sounds[id];
    let frequencies = [327.25, 493.88, 440.0, 392.0];
    if (!note) note = new Sound(this.audioContext);
    this.setState(state => {
      state.sounds[id] = note;
      return state;
    });
    let now = this.audioContext.currentTime;
    note.play(frequencies[id], now);
  };

  playErrorSound = () => {
    let frequency = 150;
    this.errorSound = new Sound(this.audioContext, 'triangle');
    let now = this.audioContext.currentTime;
    this.errorSound.play(frequency, now);
    setTimeout(() => {
      this.stopErrorSound();
    }, 700);
  };

  stopErrorSound = () => {
    if (!this.errorSound) return;
    let now = this.audioContext.currentTime;
    this.errorSound.stop(now);
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
      if ((index + 1) % 2 === 0) {
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
    if (display !== null || sequence.length === 0) return display;
    return sequence.length < 10 ? `0${sequence.length}` : sequence.length;
  };

  anounceWin = buttonId => {
    let { sequence } = this.state;
    this.setState({
      playEnabled: false
    });
    this.winTimeout = setTimeout(() => {
      this.stopEverySound();
      this.showBlinkingMessage('**', 3);
      this.showBlinkingButton(sequence.pop(), 10);
    }, 1500);
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
  constructor(context, type = 'sine') {
    this.context = context;
    this.type = type;
  }

  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = this.type;
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
