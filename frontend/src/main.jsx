import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/socketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <AuthContextProvider>
        <ThemeProvider>
          <SocketContextProvider>
            <App />
          </SocketContextProvider>
        </ThemeProvider>
      </AuthContextProvider>
    </StrictMode>
  </BrowserRouter>
);
