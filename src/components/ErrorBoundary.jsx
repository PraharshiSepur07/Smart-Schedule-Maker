import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ paddingTop: '3rem' }}>
          <div className="info-box info-amber" style={{ background: '#FFF8E6', borderColor: '#FDE68A' }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Something went wrong while rendering the planner.</div>
            <div style={{ marginBottom: 10, color: 'var(--text2)' }}>
              {this.state.error?.message || 'A UI error stopped the page from showing.'}
            </div>
            <button className="btn-p" style={{ width: 'auto', padding: '9px 16px' }} onClick={this.handleRetry}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}