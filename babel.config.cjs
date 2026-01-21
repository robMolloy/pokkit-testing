module.exports = {
  presets: [
    [
      "@babel/preset-env",
      { targets: { node: "current" } }, // Jest runs in Node
    ],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
