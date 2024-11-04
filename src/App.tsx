import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Fetcher from './Fetcher'
import { SpecContext } from './SpecContext'

function App() {
  const [state, setState] = useState({ spec: null });
  return (
      <SpecContext.Provider value={state}>
        <Fetcher onSubmit={setState}/>
        <div>{JSON.stringify(state)}</div>
      </SpecContext.Provider>
  )
}

export default App
