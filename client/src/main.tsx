import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { FRONTEND_ONLY_PREVIEW } from "@/lib/frontend-only";
import { installFrontendOnlyMocks } from "@/mocks/frontend-only";
import "./index.css";

if (FRONTEND_ONLY_PREVIEW) {
  installFrontendOnlyMocks();
}

// Set dark mode as default (OpenClaw theme)
const storedTheme = localStorage.getItem("theme");
if (!storedTheme) {
  document.documentElement.classList.add("dark");
} else if (storedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else if (storedTheme === "system") {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
