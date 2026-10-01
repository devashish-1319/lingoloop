import { Component } from "react";

// catches render errors so a bug in one component doesn't leave a blank screen
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <button className="btn btn-primary" onClick={() => window.location.assign("/")}>
          Back to home
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
