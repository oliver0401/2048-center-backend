module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^consts$": "<rootDir>/src/consts",
    "^errors$": "<rootDir>/src/errors",
    "^entities$": "<rootDir>/src/entities",
    "^utils$": "<rootDir>/src/utils",
    "^types$": "<rootDir>/src/types",
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
