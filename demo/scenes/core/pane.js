import React from 'react';
// import PropTypes from 'prop-types';
import Card from 'antd/lib/card';
import marked from 'marked';

export default class Pane extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      logs: {}
    };
  }

  log(tag, title, summary, code) {
    // markdown
    if (arguments.length === 1) {
      let tagName = Object.keys(this.state.logs)[0] || '文档说明';
      tag = tag.trim();
      if (tag[0] === '#') {
        const tmp = tag.split('\n');
        tagName = tmp.shift().split(/^#+/)[1].trim();
        tag = tmp.join('\n');
      }
      if (!this.state.logs[tagName]) {
        /* eslint-disable react/no-direct-mutation-state */
        this.state.logs[tagName] = [];
      }
      const summary = marked(tag.replace(/\s{9}(\S)/g, ($0, $1) => '\n' + $1));
      this.state.logs[tagName].push({
        summary: summary
      });
    } else {
      if (!this.state.logs[tag]) {
        /* eslint-disable react/no-direct-mutation-state */
        this.state.logs[tag] = [];
      }
      this.state.logs[tag].push({
        title: title,
        summary: summary,
        code: code
      });
    }

    this.forceUpdate();
  }

  render() {
    const tags = Object.keys(this.state.logs);
    return (<div>
      {tags.map((tagName) => {
        const logs = this.state.logs[tagName];
        return (<Card key={tagName} title={(<h2 style={{marginBottom: 0}}>{tagName}</h2>)} bordered={false}>
          {logs.map((log, index) => {
            return log.title ? (<div key={index}>
              <h5>{(index + 1) + '. ' + log.title}</h5>
              <p>{log.summary}</p>
              {log.code ? (<pre>{log.code}</pre>) : null }</div>) :
              (<div key={index} dangerouslySetInnerHTML={{__html: log.summary}}></div>);
          })}
        </Card>);
      })}
    </div>);
  }
}
