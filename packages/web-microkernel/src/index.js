import Core from './Core'

const core = Core({
  ErrorEvent,
  EventTarget,
  getRandomValues: typedArray => window.crypto.getRandomValues(typedArray)
})

const tag = `web-microkernel`

const addListener = listener => {
  const multiplexed = ({ data: { data, type }, source }) => {
    if (type === tag) {
      listener({ data, source })
    }
  }

  window.addEventListener(`message`, multiplexed)
}

const postMessage = frames => (processName, message) => {
  const target = processName === null ? window.parent : frames[processName]
  const multiplexed = { type: tag, data: message }
  target.postMessage(multiplexed, `*`)
}

const ChildProcess = (options, exportedFunction) =>
  core.ChildProcess(
    {
      addListener,
      postMessage: postMessage(window.parent.frames),
      processName: window.name,
      ...options
    },
    exportedFunction
  )

const hide = element => {
  element.style.display = `none`
}

const frameElement = document.getElementById(`frame`)

const insertHTML = HTML => {
  frameElement.insertAdjacentHTML(`beforeend`, HTML)
  return frameElement.lastChild
}

const show = (element, color) => {
  element.style.display = `block`
  frameElement.style.borderColor = color
}

const RootProcess = options =>
  core.RootProcess({
    addListener,
    hide,
    insertHTML,
    postMessage: postMessage(window.frames),
    show,
    ...options
  })

const { sanitizeFunction } = core
export { ChildProcess, RootProcess, sanitizeFunction }
