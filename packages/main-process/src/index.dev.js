import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import './favicons'
import configureStore from 'store'
import configureLocales from 'services/LocalesService'
import App from 'scenes/app.js'
import Error from './index.error'

const renderApp = (Component, root) => {
  const { messages } = configureLocales(root.store)

  const render = (Component, messages, { store, history }) => {
    ReactDOM.render(
      <AppContainer key={Math.random()} warnings={false}>
        <Component store={store} history={history} messages={messages} />
      </AppContainer>,
      document.getElementById('app')
    )
  }

  render(App, messages, root)

  if (module.hot) {
    module.hot.accept('./scenes/app.js', () =>
      render(require('./scenes/app.js').default, messages, root)
    )
  }
}

const renderError = e => {
  // eslint-disable-next-line no-console
  console.error(e)
  ReactDOM.render(<Error />, document.getElementById('app'))
}

configureStore()
  .then(root => {
    renderApp(App, root)
  })
  .catch(e => {
    renderError(e)
  })
