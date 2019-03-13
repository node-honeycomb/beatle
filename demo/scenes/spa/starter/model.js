import Beatle from '../../../../src';

export default class CounterModel extends Beatle.BaseModel {
  state = {
    counter: 0
  }

  increment() {
    this.setState({
      counter: (state) => {
        return state.counter + 1;
      }
    });
  }

  doubleAsync() {
    setTimeout(() => {
      this.setState({
        counter: (state) => {
          return state.counter * 2;
        }
      });
    }, 200);
  }
}
