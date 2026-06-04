/**
 * Home page (redirect to ConvertPage) - kept for route compatibility
 */

import { Navigate } from 'react-router';

export default function Home() {
  return <Navigate to="/" replace />;
}
