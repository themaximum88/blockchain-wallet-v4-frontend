import axios from 'axios'
import * as kernel from 'web-microkernel'

import './favicons'

const LOCATION_CHANGE = `@@router/LOCATION_CHANGE`

const securityProcessPaths = [
  `/authorize-approve`,
  `/help`,
  `/login`,
  `/logout`,
  `/mobile-login`,
  `/recover`,
  `/reminder`,
  `/reset-2fa`,
  `/reset-two-factor`,
  `/security-center`,
  `/signup`,
  `/verify-email`
]

const pathIsInSecurityProcess = pathname =>
  securityProcessPaths.some(path => pathname.startsWith(path))

;(async () => {
  const rootProcess = kernel.RootProcess()
  rootProcess.addEventListener(`error`, console.error)
  const { createProcess, setForeground } = rootProcess

  const options = await (await fetch(
    '/Resources/wallet-options-v4.json'
  )).json()

  const [mainProcess, securityProcess] = await Promise.all([
    createProcess({ name: `main`, src: `/main.html` }),
    createProcess({ name: `security`, src: `/security.html` })
  ])

  const sanitizedAxios = kernel.sanitizeFunction(axios)
  let mainProcessExports
  const mainProcessActions = []

  const processMainActionsQueue = () => {
    if (mainProcessExports) {
      while (mainProcessActions.length > 0) {
        const action = mainProcessActions.shift()
        mainProcessExports.dispatch(action)
      }
    }
  }

  const mainProcessDispatch = action => {
    mainProcessActions.push(action)
    processMainActionsQueue()
  }

  const replaceUrl = url => {
    const data = {}
    const title = ``
    window.history.replaceState(data, title, url)
  }

  const setForegroundProcess = path => {
    if (pathIsInSecurityProcess(path)) {
      setForeground(securityProcess, `lightgreen`)
    } else {
      setForeground(mainProcess, `red`)
    }
  }

  const replaceFragment = identifier => {
    const [withoutFragment] = window.location.href.split(`#`)
    replaceUrl(`${withoutFragment}#${identifier}`)
    setForegroundProcess(identifier)
  }

  // We remember the most recent Main Process location so we can revert the
  // address bar to it when the back button is pressed in the Security Center.
  let mainProcessPathname

  const dispatchFromSecurityProcess = action => {
    if (action.type === LOCATION_CHANGE) {
      const { pathname } = action.payload.location

      if (pathIsInSecurityProcess(pathname)) {
        replaceFragment(pathname)
      } else {
        // If the Security Center is going back to /home then show the most
        // recent location in the Main Process.
        if (pathname === `/home`) {
          replaceFragment(mainProcessPathname)
        } else {
          replaceFragment(pathname)
          mainProcessDispatch(action)
        }
      }
    }
  }

  const localStorageProxy = {
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: key => localStorage.removeItem(key)
  }

  const logout = () => {
    // router will fallback to /login route
    replaceUrl(`#`)
    window.location.reload(true)
  }

  const securityProcessExports = await securityProcess({
    axios: sanitizedAxios,
    localStorage: localStorageProxy,
    logout,
    mainProcessDispatch,
    options,
    pathname: window.location.pathname,
    rootProcessDispatch: dispatchFromSecurityProcess
  })

  window.addEventListener(`popstate`, () => {
    const pathname = window.location.hash.slice(1)

    const action = {
      type: LOCATION_CHANGE,
      meta: { forwarded: true },
      payload: { action: `PUSH`, location: { hash: ``, pathname, search: `` } }
    }

    if (pathIsInSecurityProcess(pathname)) {
      securityProcessExports.dispatch(action)
    } else {
      mainProcessDispatch(action)
    }

    setForegroundProcess(pathname)
  })

  // update url with new language without forcing browser reload
  const addLanguageToUrl = language => {
    replaceUrl(`/${language}/${window.location.hash}`)
  }

  const dispatchFromMainProcess = action => {
    if (action.type === LOCATION_CHANGE) {
      const { pathname } = action.payload.location

      // The Main Process doesn't have a /security-center route.
      if (pathname !== `/security-center`) {
        mainProcessPathname = pathname
      }

      replaceFragment(pathname)

      if (pathIsInSecurityProcess(pathname)) {
        securityProcessExports.dispatch(action)
      }
    }
  }

  mainProcessExports = await mainProcess({
    addLanguageToUrl,
    axios: sanitizedAxios,
    options,
    pathname: window.location.pathname,
    rootProcessDispatch: dispatchFromMainProcess,
    securityProcess: securityProcessExports
  })

  processMainActionsQueue()
})().catch(console.error)
