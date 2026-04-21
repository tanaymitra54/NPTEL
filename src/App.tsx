import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Run from './pages/Run'
import Learn from './pages/Learn'
import Report from './pages/Report'
import Stats from './pages/Stats'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/run" element={<Run />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/report" element={<Report />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
