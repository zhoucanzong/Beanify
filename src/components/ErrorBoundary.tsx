/**
 * ErrorBoundary — catches render errors and shows them instead of white screen
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; info: ErrorInfo | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '40px', fontFamily: 'system-ui, sans-serif',
          maxWidth: '800px', margin: '0 auto',
        }}>
          <h2 style={{ color: '#E85D75', marginBottom: '16px' }}>
            渲染出错
          </h2>
          <div style={{
            background: '#F5F5F5', padding: '16px', borderRadius: '8px',
            overflow: 'auto', fontSize: '13px', lineHeight: '1.6',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {this.state.error.stack || this.state.error.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
