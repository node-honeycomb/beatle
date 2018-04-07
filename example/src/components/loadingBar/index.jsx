import React from 'react';
import {bool, number, object, string} from 'prop-types';

export const UPDATE_TIME = 200;
export const MAX_PROGRESS = 99;
export const PROGRESS_INCREASE = 10;
export const ANIMATION_TIME = UPDATE_TIME * 4;
export const TERMINATING_ANIMATION_TIME = UPDATE_TIME / 2;

const initialState = {
  terminatingAnimationTimeout: null,
  percent: 0,
  progressInterval: null
};

const DEFAULT_SCOPE = 'default';

export default class LoadingBar extends React.Component {
  static instances = {};

  static showLoading(scope = DEFAULT_SCOPE) {
    const instance = LoadingBar.instances[scope];
    if (instance && instance.handleUpdate) {
      instance.handleUpdate({
        loading: (instance.state.loading || 0) + 1
      });
    } else {
      LoadingBar.instances[scope] = (LoadingBar.instances[scope] || 0) + 1;
    }
  }

  static hideLoading(scope = DEFAULT_SCOPE) {
    const instance = LoadingBar.instances[scope];
    if (instance && instance.handleUpdate) {
      instance.handleUpdate({
        loading: Math.max(0, (instance.state.loading || 1) - 1)
      });
    }
  }

  static resetLoading(scope = DEFAULT_SCOPE) {
    const instance = LoadingBar.instances[scope];
    if (instance && instance.handleUpdate) {
      instance.handleUpdate({loading: 0});
    }
  }

  static propTypes = {
    className: string,
    loading: number,
    maxProgress: number,
    progressIncrease: number,
    showFastActions: bool,
    updateTime: number,
    // eslint-disable-next-line react/no-unused-prop-types
    scope: string,
    // eslint-disable-next-line react/forbid-prop-types
    style: object
  }

  static defaultProps = {
    className: '',
    loading: 0,
    maxProgress: MAX_PROGRESS,
    progressIncrease: PROGRESS_INCREASE,
    showFastActions: false,
    style: {},
    updateTime: UPDATE_TIME,
    scope: DEFAULT_SCOPE
  }

  constructor(props) {
    super(props);

    this.state = {
      ...initialState,
      loading: LoadingBar.instances[props.scope] === undefined ? props.loading : LoadingBar.instances[props.scope].loading
    };
    this.style = {
      opacity: '0',
      transform: 'scaleX(0)',
      transformOrigin: 'left',
      width: '100%',
      willChange: 'transform, opacity'
    };

    // Use default styling if there's no CSS class applied
    if (!this.props.className) {
      this.style.height = '3px';
      this.style.backgroundColor = 'red';
      this.style.position = 'absolute';
    }

    Object.assign(this.style, this.props.style);

    this.boundSimulateProgress = this
      .simulateProgress
      .bind(this);
    this.boundResetProgress = this
      .resetProgress
      .bind(this);

    LoadingBar.instances[props.scope] = this;
  }

  componentDidMount() {
    // Re-render the component after mount to fix problems with SSR and CSP.
    //
    // Apps that use Server Side Rendering and has Content Security Policy for style
    // that doesn't allow inline styles should render an empty div and replace it
    // with the actual Loading Bar after mount See:
    // https://github.com/mironov/react-redux-loading-bar/issues/39
    //
    // eslint-disable-next-line react/no-did-mount-set-state
    this.mounted = true;

    if (this.state.loading > 0) {
      this.launch();
    }
  }

  handleUpdate(nextProps) {
    if (this.shouldStart(nextProps)) {
      this.launch();
    } else if (this.shouldStop(nextProps)) {
      if (this.state.percent === 0 && !this.props.showFastActions) {
        // not even shown yet because the action finished quickly after start
        clearInterval(this.state.progressInterval);
        this.resetProgress();
      } else {
        // should progress to 100 percent
        this.setState({percent: 100});
      }
    }
  }

  // componentWillReceiveProps(nextProps) {   this.handleUpdate(nextProps); }

  componentWillUnmount() {
    clearInterval(this.state.progressInterval);
    clearTimeout(this.state.terminatingAnimationTimeout);
  }

  shouldStart(nextProps) {
    if (!this.state.loading && nextProps.loading > 0) {
      this.setState({loading: nextProps.loading});
      return true;
    } else {
      return false;
    }
  }

  shouldStop(nextProps) {
    if (this.state.progressInterval && nextProps.loading === 0) {
      this.setState({loading: nextProps.loading});
      return true;
    } else {
      return false;
    }
  }

  shouldShow() {
    return this.state.percent > 0 && this.state.percent <= 100;
  }

  launch() {
    let {percent} = this.state;
    const {terminatingAnimationTimeout} = this.state;

    const loadingBarNotShown = !this._progressInterval;
    const terminatingAnimationGoing = percent === 100;

    if (loadingBarNotShown) {
      this._progressInterval = setInterval(this.boundSimulateProgress, this.props.updateTime);
    }

    if (terminatingAnimationGoing) {
      clearTimeout(terminatingAnimationTimeout);
    }

    percent = 0;

    this.setState({progressInterval: this._progressInterval, percent: percent});
  }

  newPercent() {
    const {percent} = this.state;
    const {progressIncrease} = this.props;

    // Use cos as a smoothing function Can be any function to slow down progress
    // near the 100%
    const smoothedProgressIncrease = (progressIncrease * Math.cos(percent * (Math.PI / 2 / 100)));

    return percent + smoothedProgressIncrease;
  }

  simulateProgress() {
    let {progressInterval, percent, terminatingAnimationTimeout} = this.state;
    const {maxProgress} = this.props;

    if (percent === 100) {
      clearInterval(progressInterval);
      terminatingAnimationTimeout = setTimeout(this.boundResetProgress, TERMINATING_ANIMATION_TIME);
      progressInterval = null;
    } else if (this.newPercent() <= maxProgress) {
      percent = this.newPercent();
    }

    this.setState({percent, progressInterval, terminatingAnimationTimeout});
  }

  resetProgress() {
    this.setState(initialState);
  }

  buildStyle() {
    const animationTime = (this.state.percent !== 100 ? ANIMATION_TIME : TERMINATING_ANIMATION_TIME);

    this.style = Object.assign({}, this.style, {
      transform: `scaleX(${this.state.percent / 100})`,
      transition: `transform ${animationTime}ms linear`,
      opacity: this.shouldShow() ? '1' : '0'
    });
    return this.style;
  }

  render() {
    // In order not to violate strict style CSP it's better to make an extra
    // re-render after component mount
    if (!this.mounted) {
      return (<div />);
    }

    return (
      <div>
        <div style={this.buildStyle()} className={this.props.className} />
        <div style={{
          display: 'table',
          clear: 'both'
        }} />
      </div>
    );
  }
}
