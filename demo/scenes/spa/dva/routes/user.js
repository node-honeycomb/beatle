import React from 'react';
import styles from './user.css';
import UsersComponent from '../users/component';

function Users() {
  return (
    <div className={styles.normal}>
      <UsersComponent />
    </div>
  );
}

export default Users;
