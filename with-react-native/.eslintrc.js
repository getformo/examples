module.exports = {
  extends: ["expo"],
  ignorePatterns: [".expo", "coverage"],
  rules: {
    "react-hooks/set-state-in-effect": "off",
  },
  overrides: [
    {
      files: ["jest.setup.js", "__tests__/**/*"],
      env: { jest: true },
    },
  ],
};
