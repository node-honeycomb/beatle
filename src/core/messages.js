// # 所有校验提示文案

export default {
  // location, name, expected, component
  // credential : 'Warning: Error Credential while fetch, check the `%s` in `%s`, expected `%s`. `%s`',
  // location, expected, component
  // deprecated : 'Warning: %s(...) is deprecated and should not be used. You can use this `%s` directly instead. `%s`',
  // location, name, component
  displayName: 'Warning: Failed %s value: Check the value of `displayName` in `%s`. `%s`',
  // location, name, value, component, expected
  invalidValue: 'Warning: Failed %s value: `%s` of value `%s` supplied to `%s`, expected `%s`',
  // location, component
  appoint: 'Warning: %s(...) can only to be called by a Beatle instance, default by mainApp: `%s`',
  // location, component
  duplicate: 'Warning: %s(...) can only to be called once: `%s`',
  // location, value, name, component
  duplicateProp: 'Warning: Overlay %s property: assign `%s` to `%s` more than once. `%s`',
  // location, name, expected, component
  invalidProp: 'Warning: %s(...) `%s` is not a prop, expected `%s`. `%s`'
};
