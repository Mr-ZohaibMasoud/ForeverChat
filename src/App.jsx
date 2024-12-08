// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import ChatApp from './ChatApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<ChatApp />} />
        {/* Default route, could be login if unauthenticated */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
