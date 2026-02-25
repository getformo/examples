import { useFormo } from "@formo/analytics";
import logo from "../logo.svg";

function MainPage() {
  const analytics = useFormo();

  return (
    <div className="App">
      <header className="App-header">
        <button
          onClick={() => analytics.track("custom_event", { key: "value" })}
        >
          Click here to track click button event
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default MainPage;
