import React from 'react';
import PropTypes from 'prop-types';
import {IndexLink, Link} from 'react-router';

const PageLayout = ({children}) => (
  <div className='container text-center'>
    <h1>From Redux to Beatle Refactor in Demo</h1>
    <IndexLink to='/' activeClassName='page-layout__nav-item--active'>Home</IndexLink>
    {' · '}
    <Link to='/counter' activeClassName='page-layout__nav-item--active'>Counter</Link>
    <div className='page-layout__viewport'>
      {children}
    </div>
  </div>
);

PageLayout.propTypes = {
  children: PropTypes.node,
};

export default PageLayout;
