import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Routes, Route } from "react-router-dom";
import Home from './components/Home';
import EditorPage from './components/EditorPage';
import { Toaster } from 'react-hot-toast';
import DrawingBoard from './components/DrawingBoard';
import ChatVoicePage from './components/ChatVoicePage';
import FileSharePage from './components/FileSharePage';
import VideoSharePage from './components/VideoSharePage';

function App() {
  return (
    <>
    <div>
      <Toaster  position='top-center'></Toaster>
    </div>
    <Routes>
     <Route path='/' element={ <Home /> } />
     <Route path='/editor/:roomId' element={ <EditorPage /> } />
     <Route path="/drawing/:roomId" element={<DrawingBoard />} />
     <Route path="/chatvoice/:roomId" element={<ChatVoicePage />} />
      <Route path="/fileshare/:roomId" element={<FileSharePage/>} />
      <Route path="/videoshare/:roomId" element={<VideoSharePage/>} />
    </Routes>
    </>
  );
}

export default App;
