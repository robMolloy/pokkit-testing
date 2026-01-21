export default {
  testEnvironment: "node",

  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Transform PocketBase even though it's in node_modules
  transformIgnorePatterns: ["/node_modules/(?!(pocketbase)/)"],

  // Only include extensions that are ambiguous; .js inferred from "type": "module"
  extensionsToTreatAsEsm: [".jsx"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
