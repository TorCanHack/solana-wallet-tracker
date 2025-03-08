import { useState } from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import './App.css'
import Analyzer from './pages/Analyzer'
import Home from './pages/Home'

function App() {
  const [address, setAddress] = useState('')
  

  return (
    <BrowserRouter>
      <Routes>

        <Route path='/' element={<Home address={address} setAddress={setAddress}/>}/>
        <Route path='/analyzer' element={<Analyzer address={address} setAddress={setAddress}/>}/>

      </Routes>
      

    </BrowserRouter>
  )
}

export default App
