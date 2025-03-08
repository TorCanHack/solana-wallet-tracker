import { useState } from 'react';
import {useNavigate} from 'react-router-dom'
import logo from '../assets/logo.png'
import pasteIcon from '../assets/paste.png'

const Home = ({address, setAddress}) => {

 
  const navigate = useNavigate()

  const handleInput = (e) => {

    const {value} = e.target
    setAddress(value)

  }

  const handlePaste = async () => {
    try {
      const collectedText = await navigator.clipboard.readText();
      setAddress(collectedText)
    } catch(error){
      console.error("Failed to read clipboard ", error)
    }
  }

  const handleAnnalyse = () => {
    navigate('/analyzer')

    
  }

    return (
      <section className="flex flex-col justify-center items-center bg-purple-900  h-screen w-screen px-4">
      <div className='flex flex-row justify-center items-center bg-gradient-to-r from-purple-900 to-green-900 h-10  p-4 rounded-xl text-white border-2 border-white '>
        <img src={logo} alt='logo' className='h-8 w-8 rounded-4xl mr-2 animate-bounce'/>
        
        <h1 className='font-bold'>Solana Wallet Analyzer</h1>
      </div>
      <div className='flex flex-col border-3 border-white w-full lg:w-1/3 h-96 px-6 py-12 bg-gradient-to-r from-purple-900 to-green-900  rounded-2xl '>

          <div className='flex flex-col bg-white  p-6 rounded-2xl'>
            <input 
              type='text' 
              value={address} 
              placeholder='paste wallet address' 
              className='h-10 bg-gradient-to-r from-purple-900 to-green-900  rounded-xl border-2 border-white text-white placeholder:text-center placeholder:text-white px-6 '
              onChange={handleInput}
            />

            <button 
              onClick={handlePaste}
              className={`relative bottom-7 left-68 h-5 w-5 cursor-pointer ${address !== '' ? 'hidden' : 'flex'}`}
            >
              <img src={pasteIcon} alt='paste button'/>
            </button>

            <button 
              className='text-white mt-12 border-2 border-white rounded-2xl bg-gradient-to-r from-purple-900 to-green-900  ' 
              onClick={handleAnnalyse}
            >
              Analyze
            </button>
          </div>

      </div>
      </section>
    )
}

export default Home;