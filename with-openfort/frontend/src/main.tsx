import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Suppress unhandled rejections thrown internally by the Aave SDK (InvariantError)
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.name === "InvariantError") {
    event.preventDefault();
  }
});
import "./index.css";
import { Providers } from "./Providers.tsx";
import { EnvValidationWrapper } from "./components/env_validation/EnvValidationWrapper.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EnvValidationWrapper>
      <Providers>
        <App />
      </Providers>
    </EnvValidationWrapper>
  </StrictMode>,
);
