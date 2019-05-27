import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import App from './App';

const render = (route: string) =>
  renderToString(
    <StaticRouter location={route}>
      <App />
    </StaticRouter>,
  );

interface RenderParams {
  route: string;
  clientStats: any;
}
export default ({ route, clientStats }: RenderParams) => {
  return `<html>
    <body>
        <div id="app">${render(route)}</div>
        ${clientStats.entrypoints.main.assets.map(
          (asset: string) => `<script src="${asset}"></script>`,
        )}
    </body>
  </html>`;
};
