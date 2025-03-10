"use client";
import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-red-600 dark:text-red-400">Something went wrong</h3>
          <p className="text-red-500 dark:text-red-300">Please try again later</p>
        </div>
      );
    }

    return this.props.children;
  }
} 