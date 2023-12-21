import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Punter from './components/Punter/index.tsx';
import Student from './components/Student/index.tsx';

export default function App() {
  const Welcome = () => (
    <h2 style={{ textAlign: 'center', padding: 20 }}>欢迎来到辅助系统</h2>
  );
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />}></Route>
        <Route path="/student" element={<Student />} />
        <Route path="/punter" element={<Punter />} />
      </Routes>
    </BrowserRouter>
  );
}
