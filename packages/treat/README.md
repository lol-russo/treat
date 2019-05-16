# 🍬 treat

[![treat@next](https://img.shields.io/npm/v/treat/next.svg?label=treat@next&logo=npm&style=for-the-badge)](https://www.npmjs.com/package/treat)

Themeable, typed CSS-in-JS with (basically) zero runtime. What a treat.

```bash
$ yarn add treat@next
```

Write your styles in JavaScript/TypeScript within **_treat files_** (e.g. `Button.treat.js`) that get **_executed at build time_**.

All CSS rules are created ahead of time, so the runtime is _very_ lightweight—only needing to swap out pre-existing classes. **All CSS logic, including its dependencies, will not be included in your final bundle.**

Because theming is achieved by generating multiple classes, **legacy browsers are supported.**

---

- [Requirements](#requirements)
- [tl;dr (React version)](#tldr-react-version)
- [Webpack Setup](#webpack-setup)
- [Babel Setup](#babel-setup)
- [API Reference](#api-reference)
  - [Data Types](#data-types)
    - [Styles](#styles)
    - [ThemedStyles](#themedstyles)
    - [Theme](#theme)
  - [Styling API](#styling-api)
    - [createTheme](#createtheme)
    - [style](#style)
    - [css](#css)
    - [globalStyle](#globalstyle)
  - [Debugging](#debugging)
  - [React API](#react-api)
    - [TreatProvider](#treatprovider)
    - [useClassNames](#useclassnames)
    - [useStyles](#usestyles)
  - [Low-Level API](#low-level-api)
    - [resolveClassNames](#resolveclassnames)
    - [resolveStyles](#resolvestyles)

---

## Requirements

Your project must be using [webpack](#webpack-setup) with the supplied [webpack plugin](#webpack-setup), but that's it.

**We provide first-class support for [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/),** but those layers are _entirely optional._ We also provide low level runtime APIs that could be integrated into other frameworks, if needed.

## tl;dr (React version)

> React is [not required](#low-level-api) to use treat—but it certainly makes it easy 😎

First, install all dependencies:

```bash
$ yarn add treat@next react-treat@next
```

Then, create a theme. Normally, you'd define multiple themes, but let's keep it short.

```js
// theme.treat.js

// ** THIS CODE WON'T END UP IN YOUR BUNDLE! **

import { createTheme } from 'treat';

export default createTheme({
  brandColor: 'blue',
  grid: 4
});
```

During render, provide the desired theme via context.

```js
// App.js

import React from 'react';
import { TreatProvider } from 'react-treat';

import theme from './theme.treat.js';

export function App() {
  return <TreatProvider theme={theme}>...</TreatProvider>;
}
```

Define some [styles](#styles), using the theme.

```js
// Button.treat.js

// ** THIS CODE WON'T END UP IN YOUR BUNDLE EITHER! **

import { style } from 'treat';

export const button = style(theme => ({
  backgroundColor: theme.brandColor,
  height: theme.grid * 11
}));
```

Then render themed classes via the [`useClassNames` Hook.](#useclassnames)

```js
// Button.js

import React from 'react';
import { useClassNames } from 'react-treat';

import * as styles from './Button.treat.js';

export function Button({ className, ...restProps }) {
  return (
    <button
      className={useClassNames(styles.button, className)}
      {...restProps}
    />
  );
}
```

## Webpack Setup

To get started, add the treat [webpack](https://webpack.js.org/) plugin to [`webpack.config.js`](https://webpack.js.org/concepts/configuration).

```js
const TreatPlugin = require('treat/webpack-plugin');

module.exports = {
  plugins: [new TreatPlugin()]
};
```

By default, this will inject styles into the page via [style-loader](https://github.com/webpack-contrib/style-loader), but this can be overridden via the `outputLoaders` option.

For example, if you'd like to **export static CSS files,** you can wire it up to [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).

```js
const TreatPlugin = require('treat/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new TreatPlugin({
      outputLoaders: [MiniCssExtractPlugin.loader]
    }),
    new MiniCssExtractPlugin()
  ]
};
```

By default, all class names are hashes. If you'd like more fine-grained control over the generated class names, you can create your own [custom interpolations](https://github.com/webpack/loader-utils#interpolatename).

<!-- prettier-ignore -->
```js
module.exports = {
  plugins: [
    new TreatPlugin({
      localIdentName: '[name]-[local]_[hash:base64:5]',
      themeIdentName: '_[folder]-[name]_[hash:base64:5]'
    })
  ]
};
```

`themeIdentName` can also be a function that receives your theme as a parameter. This allows you to minimize the characters in your theme ident for production.

> Warning: Ensure all themes have a unique ident value.

<!-- prettier-ignore -->
```js
const themes = ['light', 'dark'];

module.exports = {
  plugins: [
    new TreatPlugin({
      themeIdentName: (theme) => themes.indexOf(theme.name)
    })
  ]
};
```

### Webpack plugin options

| option         | description                                                                                                                                         | default value                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| test           | [Webpack condition](https://webpack.js.org/configuration/module/#rule-conditions) targetting `treat` files.                                         | `/\.treat.(js\|ts)$/`                                                                                                                      |
| outputCSS      | Whether to output CSS into the bundle. Useful for dual config SSR apps.                                                                             | `true`                                                                                                                                     |
| outputLoaders  | Array of webpack loaders to handle CSS files, they will be placed after `css-loader`. Strings and objects with options are supported.               | `['style-loader']`                                                                                                                         |
| localIdentName | Template string for naming css classes. Should always contain a `hash` option to avoid clashes.                                                     | `[hash:base64:5]`                                                                                                                          |
| themeIdentName | Same as `localIdentName` but for themes. Useful for debugging which classes belong to which theme. Can also be a function that receives your theme. | `[hash:base64:4]`                                                                                                                          |
| minify         | Minify the output css                                                                                                                               | Inferred from [webpack mode](https://webpack.js.org/concepts/#mode). Defaults to `true` if `production` mode.                              |
| browsers       | A [browserslist](https://github.com/browserslist/browserslist) query to pass to [autoprefixer](https://github.com/postcss/autoprefixer)             | By default, your browserslist query will be resolved from your [browserslist config](https://github.com/browserslist/browserslist#queries) |

## Babel Setup

While entirely optional, treat provides a Babel plugin to improve the [debugging](#debugging) experience.

First, install the plugin:

```bash
$ yarn add --dev babel-plugin-treat@next
```

Then, add it to your Babel config. For example, in `.babelrc`:

```js
{
  "plugins": ["babel-plugin-treat"]
}
```

## API Reference

### Data Types

While not an exhaustive list of all types defined in the library, this section covers the core data types that are essential to using the library.

#### Styles

Type: `object`

When passing styles to the [`style`](#style) and [`css`](#css) functions, or returning styles from a [`ThemedStyles` function](#themedstyles), you'll need to define them in the following format.

```js
{
  color: 'red',
  fontFamily: 'comic sans ms',
  fontSize: 24
}
```

Simple psuedo selectors are supported at the top level.

```js
{
  color: 'red',
  ':hover': {
    backgroundColor: 'pink'
  },
  ':active': {
    backgroundColor: 'tomato'
  }
}
```

Media queries are also supported via the `@media` key.

```js
{
  fontSize: 24,
  '@media': {
    'screen and (min-width: 768px)': {
      fontSize: 42
    }
  }
}
```

For anything more advanced, you can provide a set of custom selectors. Within each selector, you must provide the ampersand character (`&`), which refers to the generated class name.

```js
{
  marginRight: 10,
  selectors: {
    '&:nth-child(2n)': {
      marginRight: 0
    }
  }
}
```

Within selectors, existing treat classes can be referenced.

```js
{
  backgroundColor: 'white',
  selectors: {
    [`${parentClass} &`]: {
      backgroundColor: 'aqua'
    }
  }
}
```

#### ThemedStyles

Type: `function`

Accepts a [`Theme`](#theme) and returns a [`Styles` object.](#styles)

```js
theme => ({
  color: theme.brandColor
});
```

#### Theme

When [defining themes](#createtheme) and [consuming themes](#themedstyles), the provided theme object uses the `Theme` type, which is `any` by default. This means that any usage of a theme will not be type-safe.

The simplest way to fix this is to override this type at a global level. For example, you could create a `treat.d.ts` file in your project with the following contents.

```tsx
declare module 'treat/theme' {
  export interface Theme {
    brandColor: string;
    grid: number;
  }
}
```

If your `Theme` type is already defined elsewhere in your application, you'll need to import it with a dynamic `import` expression within the module declaration block.

```tsx
declare module 'treat/theme' {
  export type Theme = import('./types').Theme;
}
```

Alternatively, if you'd prefer to avoid global types, you can manually annotate the theme object being passed into a [`ThemedStyles` function.](#themedstyles)

```tsx
import { style } from 'treat';
import { Theme } from './types';

const themedClass = style((theme: Theme) => ({
  color: theme.brandColor
}));
```

### Styling API

The following styling APIs are only valid within treat files (e.g. `Button.treat.js`).

#### createTheme

Type: `function`

```js
import { createTheme } from 'treat';

const theme = createTheme({
  brandColor: 'blue',
  grid: 4
});
```

#### style

Type: `function`

```js
import { style } from 'treat';

export const brandColor = style(theme => ({
  color: theme.brandColor;
}));
```

If your styles aren't dependent on the theme, you can provide a static object instead.

```js
import { style } from 'treat';

export const green = style({
  color: 'green'
});
```

#### css

Type: `function`

The `css` function allows you to create multiple class names at once, returning an object that maps to the generated class names (similar to [CSS Modules](https://github.com/css-modules/css-modules)).

```js
import { css } from 'treat';

export default css(theme => ({
  primary: {
    backgroundColor: theme.colors.brand
  },
  secondary: {
    backgroundColor: theme.colors.accent
  }
}));
```

#### globalStyle

Type: `function`

The `globalStyle` function allows you to define selector-based styles. This function is purely a side effect and does not create a new class.

```js
import { globalStyle } from 'treat';

globalStyle('html, body', {
  margin: 0,
  padding: 0
});
```

### Debugging

All styling APIs (except for `globalStyle`) have an optional argument that allows you to provide a local debug name.

For example, the local name for this style will be `style` by default.

<!-- prettier-ignore -->
```js
export const green = style({ color: 'green' });
```

This is because treat doesn't have access to your variable name at runtime.

To fix this, you can pass in a debug name that typically would mirror your variable name:

<!-- prettier-ignore -->
```js
export const green = style({ color: 'green' }, 'green');
```

**Note: This debug name can be automated via our [Babel plugin](#babel-setup).**

### React API

> Note: React is [not required](#low-level-api) to use treat!

#### TreatProvider

Type: `Component`

In order for the [`useClassNames`](#useclassnames) and [`useStyles`](#usestyles) Hooks to work, you'll need to render a `TreatProvider` higher in the tree.

```js
import React from 'react';
import { TreatProvider } from 'react-treat';

import theme from './theme.treat.js';

export function App() {
  return <TreatProvider theme={theme}>...</TreatProvider>;
}
```

#### useClassNames

Type: `function`

A [React Hook](https://reactjs.org/docs/hooks-intro.html) that resolves treat classes relative to the current theme, returning a single `className` string. Serves as a treat-enabled version of the [Classnames API](https://github.com/JedWatson/classnames#usage).

```js
import React from 'react';
import { useClassNames } from 'react-treat';

import * as styles from './Button.treat.js';

export function Button({ primary, ...props }) {
  return (
    <button
      {...props}
      className={useClassNames(
        styles.button,
        {
          [styles.primary]: primary
        }
        ...etc
      )}
    />
  );
}
```

#### useStyles

Type: `function`

A [React Hook](https://reactjs.org/docs/hooks-intro.html) that resolves an entire object of treat classes relative to the current theme.

```js
import React from 'react';
import { useClassNames } from 'react-treat';

import * as styleRefs from './Button.treat.js';

export function Button({ primary, ...props }) {
  const styles = useStyles(styleRefs);

  return (
    <button
      {...props}
      className={`${styles.button} ${
        primary ? styles.primary : ''
      }`}
    />
  );
}
```

### Low-Level API

> Note: If you're using React, use our [React API](#react-api) instead.

#### resolveClassNames

Type: `function`

Resolves class names relative to a given theme. Serves as a treat-enabled version of the [Classnames API](https://github.com/JedWatson/classnames#usage), but with the desired theme as the first argument.

```js
import { resolveClassNames } from 'treat';

import theme from './theme.treat.js';
import * as styles from './Button.treat.js';

const className = resolveClassNames(
  theme,
  styles.button,
  {
    [styles.primary]: isPrimary
  },
  ...etc
);
```

#### resolveStyles

Type: `function`

Resolves an entire styles object relative to a given theme.

```js
import { resolveStyles } from 'treat';
import * as styles from './styles.treat.js';
import theme from './theme.treat.js';

const themedStyles = resolveStyles(styles, theme);
```

## License

MIT.