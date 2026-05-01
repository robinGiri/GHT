import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "4rem 2rem", textAlign: "center", minHeight: "60vh" }}>
          <h1 style={{ fontSize: "2rem", color: "#1A3A3A" }}>Something went wrong</h1>
          <p style={{ color: "#555", margin: "1rem 0 2rem" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <Link
            to="/"
            style={{ color: "#2D5F52", fontWeight: 600, textDecoration: "underline" }}
            onClick={() => this.setState({ hasError: false })}
          >
            Return to Home
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
