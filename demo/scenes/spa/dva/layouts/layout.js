import React from 'react';
import styles from './layout.css';
import Header from './Header';
import {LoadingBar} from 'hc-materials';

function MainLayout({children, location}) {
  return (
    <div className={styles.normal}>
      <LoadingBar
        style={{position: 'fixed', height: 2, top: 0, zIndex: 999, backgroundColor: '#20C1EA'}}
        updateTime={100}
        maxProgress={95}
        progressIncrease={10}
      />
      <h1>From Dva to Beatle Refactor in Demo</h1>
      <Header location={location} />
      <div className={styles.content}>
        <div className={styles.main}>{children}</div>
      </div>
    </div>
  );
}

export default MainLayout;
