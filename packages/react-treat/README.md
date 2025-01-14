# 🍬 react-treat

[![react-treat@next](https://img.shields.io/npm/v/react-treat/next.svg?label=react-treat@next&logo=npm&style=for-the-badge)](https://www.npmjs.com/package/react-treat)

React bindings for [treat](https://github.com/seek-oss/treat).

[View full documentation.](https://github.com/seek-oss/treat)

## Setup

```bash
$ yarn add react-treat@next
```

## API

#### TreatProvider

Type: `Component`

In order for the [`useStyles`](#usestyles) and [`useClassName`](#useclassname) Hooks to work, you'll need to render a `TreatProvider` higher in the tree.

```js
import React from 'react';
import { TreatProvider } from 'react-treat';

import theme from './theme.treat.js';

export function App() {
  return <TreatProvider theme={theme}>...</TreatProvider>;
}
```

#### useStyles

Type: `function`

A [React Hook](https://reactjs.org/docs/hooks-intro.html) that resolves styles for an entire treat file relative to the current theme.

```js
import React from 'react';
import { useStyles } from 'react-treat';
import * as styleRefs from './Button.treat.js';

export function Button({ primary, ...props }) {
  const styles = useStyles(styleRefs);

  return <button {...props} className={styles.button} />;
}
```

#### useClassName

Type: `function`

A [React Hook](https://reactjs.org/docs/hooks-intro.html) that resolves a single treat class relative to the current theme.

```js
import React from 'react';
import { useClassName } from 'react-treat';
import * as styleRefs from './Button.treat.js';

export const Button = props => (
  <button
    {...props}
    className={useClassName(styles.button)}
  />
);
```

## License

MIT.
