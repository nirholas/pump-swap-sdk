/**
 * Specs live next to the source in src/__tests__ and run through ts-jest.
 *
 * @solana/web3.js pulls in rpc-websockets, whose uuid dependency ships as ESM only. Jest's
 * CommonJS runtime cannot require an ES module, so that one package is compiled to CommonJS
 * with babel-jest (@babel/preset-env is already a dev dependency) instead of being skipped.
 *
 * @type {import("jest").Config}
 */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(?:.+/)?uuid/)"],
};
