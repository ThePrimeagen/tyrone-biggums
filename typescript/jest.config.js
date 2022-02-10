/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: ".*__integration__.*|.*__tests__.*",
    testPathIgnorePatterns: ["dist", "node_modules"]
};
