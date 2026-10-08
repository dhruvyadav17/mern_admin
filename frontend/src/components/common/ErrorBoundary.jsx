import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5">
          <div className="card">
            <div className="card-body text-center py-5">
              <h4>Something went wrong</h4>
              <p className="text-muted mb-4">
                An unexpected error occurred. Please reload the page and try
                again.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleReload}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;