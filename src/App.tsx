import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Fetcher from './Fetcher'
import { StateContext } from './state/StateContext'
import { OpenAPI } from './state/openapi'

function App() {
  const [state, setState] = useState(new OpenAPI({}));
  return (
      <StateContext.Provider value={{spec: state, setSpec: setState}}>
      </StateContext.Provider>
  )
}

export default App
