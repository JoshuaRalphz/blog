"use client";
import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Editor Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the editor.</div>;
    }

    return this.props.children;
  }
} 