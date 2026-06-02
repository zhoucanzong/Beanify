/**
 * App - Router configuration
 * /        → Image to bead pattern conversion (ConvertPage)
 * /editor  → Pixel art editor (EditorPage)
 */

import { Routes, Route } from 'react-router';
import ConvertPage from './pages/ConvertPage';
import EditorPage from './pages/EditorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ConvertPage />} />
      <Route path="/editor" element={<EditorPage />} />
    </Routes>
  );
}
