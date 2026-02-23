# Formo Analytics React Example

This is an example React application that demonstrates how to integrate and use the Formo Analytics SDK for tracking user events and analytics.

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- A Formo Analytics write key

### Installation

1. Clone this repository:
```bash
git clone https://github.com/getformo/examples.git
cd examples/with-react
```

2. Install dependencies:
```bash
# Using npm
npm install

# Using yarn
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Formo Analytics write key:
```bash
REACT_APP_FORMO_ANALYTICS_WRITE_KEY=your_write_key_here
```

4. Start the development server:
```bash
# Using npm
npm start

# Using yarn
yarn start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
src/
├── App.js              # Main app component with FormoAnalyticsProvider
├── components/
│   └── MainPage.js     # Example component demonstrating analytics tracking
├── App.css             # Styles for the app
├── index.js            # App entry point
└── ...
```

## 🔧 How It Works

### 1. Provider Setup

The app uses the `FormoAnalyticsProvider` to initialize the Formo Analytics SDK:

```javascript
import { FormoAnalyticsProvider } from "@formo/analytics";

function App() {
  return (
    <FormoAnalyticsProvider
      writeKey={WRITE_KEY}
      options={{
        tracking: true,
        logger: {
          enabled: true,
          levels: ["debug", "info", "error", "warn", "trace"],
        },
      }}
    >
      <MainPage />
    </FormoAnalyticsProvider>
  );
}
```

### 2. Using Analytics in Components

Components can access the analytics instance using the `useFormo` hook:

```javascript
import { useFormo } from "@formo/analytics";

function MainPage() {
  const analytics = useFormo();

  const handleClick = () => {
    analytics.track("custom_event", { key: "value" });
  };

  return (
    <button onClick={handleClick}>
      Click here to track click button event
    </button>
  );
}
```

## 📊 Analytics Configuration

The Formo Analytics SDK is configured with the following options:

- **tracking**: `true` - Enables event tracking
- **logger**: Configured with debug logging enabled for all levels

You can modify these options in `src/App.js` based on your needs.

## 🎯 Available Events

This example demonstrates tracking custom events. You can extend it to track various user interactions:

- Button clicks
- Page views
- Form submissions
- User authentication events
- Custom business events

## 🛠 Available Scripts

- `npm start` / `yarn start` - Runs the app in development mode
- `npm test` / `yarn test` - Launches the test runner
- `npm run build` / `yarn build` - Builds the app for production
- `npm run eject` / `yarn eject` - Ejects from Create React App (one-way operation)

## 📚 Learn More

- [Formo Analytics Documentation](https://docs.formo.so) - Learn about Formo Analytics features
- [React Documentation](https://reactjs.org/) - Learn React
- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started) - Learn about Create React App

## 🔒 Environment Variables

Make sure to keep your Formo Analytics write key secure:

- Never commit your `.env` file to version control
- Use different write keys for development and production environments
- Consider using environment-specific configuration management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

- Check the [Formo Analytics documentation](https://docs.formo.so)
- Open an issue in this repository
- Contact Formo support team

---

Built with ❤️ using React and Formo Analytics
