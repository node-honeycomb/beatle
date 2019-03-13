import React from 'react';
import Beatle from '../../../../src';

const app = new Beatle();
class Demo extends React.PureComponent {
  render() {
    return (<h1>Hello World!</h1>);
  }
}
app.route('/', Demo);
export default app;
