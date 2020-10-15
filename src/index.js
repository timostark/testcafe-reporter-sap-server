const axios = require('axios');

require('dotenv').config();

module.exports = function () {
    return {
        async reportTaskStart(startTime, userAgents, testCount) {
            this.startTime = startTime;
            this.testCount = testCount;
            this.userAgents = userAgents;
            this.testResults = {
                'startTime': startTime,
                'testCount': testCount,
                'userAgents': userAgents,
                'fixtures': []
            };
        },

        async reportFixtureStart(name, path, meta) {
            if (this.currentTestFixture) {
                this.testResults.fixtures.push(this.currentTestFixture);
            }

            this.currentTestFixture = {
                name: name,
                path: path,
                meta: meta,
                tests: []
            };
        },

        async reportTestDone(name, testRunInfo, meta) {
            this.currentTestFixture.tests.push({
                meta: meta,
                name: name,
                testRunInfo: testRunInfo
            });
        },

        async reportTaskDone(endTime, passed, warnings, result) {
            if (this.currentTestFixture) {
                this.testResults.fixtures.push(this.currentTestFixture);
            }
            this.testResults.endTime = endTime;
            this.testResults.passed = passed;
            this.testResults.warnings = warnings;
            this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
            this.testResults.result = result;

            await axios.post({
                url: process.env.url,
                data: this.testResults,
                auth: {
                    username: process.env.user,
                    password: process.env.password
                }
            });

        }
    };
};
