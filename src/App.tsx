/**
 * App — Router configuration with error boundary
 */

import { Routes, Route } from 'react-router';
import ErrorBoundary from './components/ErrorBoundary';
import ConvertPage from './pages/ConvertPage';
import EditorPage from './pages/EditorPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<ConvertPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
