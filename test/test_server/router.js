'use strict';

const express = require('express');
const router = new express.Router();

// User
const User = [{
  key: '1',
  name: '胡彦斌',
  age: 32,
  address: '西湖区湖底公园1号'
}, {
  key: '2',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号'
}];

router.get('/api/user/list', function (req, res) {
  res.json(User);
});

router.post('/api/user', function (req, res) {
  User.push(req.body);
  res.json({
    code: 'SUCCESS'
  });
});

router.put('/api/user/:id', function (req, res) {
  const id = req.params.id;
  const user = User.reduce((origin, current) => {
    if (current.key === id) {
      return current;
    } else {
      return origin;
    }
  }, {});
  Object.assign(user, req.body);
  res.json({
    code: 'SUCCESS'
  });
});

router.delete('/api/user/:id', function (req, res) {
  const id = req.params.id;
  let idx = 0;
  for (let i = 0; i < User.length; i++) {
    let user = User[i];
    if (user.key === id) {
      idx = i;
      break;
    }
  }
  User.splice(idx, 1);
  res.json({
    code: 'SUCCESS'
  });
});

module.exports = router;
