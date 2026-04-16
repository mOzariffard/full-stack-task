import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: [],
};

export default config;
