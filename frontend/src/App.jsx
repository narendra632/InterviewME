import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Resume from './components/Resume';
import Interview from './components/Interview';
import LandingPage from './components/LandingPage';
import Rejection from './components/Rejection';
import Congrats from './components/Congrats';
import './index.css';


const App = () => {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/congrats" element={<Congrats/>}/>
          <Route path="rejects" element={<Rejection/>}/>

        </Routes>
      </Router>
    </div>
  );
};

export default App;
