const axios = require('axios');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

const ui5Utils = require('ui5-testcafe-selector-utils');
const ui5Steps = ui5Utils.ui5Steps;
const ui5Config = ui5Utils.ui5Config;

const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    }),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
});

module.exports = function () {
    return {
        createErrorDecorator() {
            return {
                'span category': () => '',
                'span step-name': str => str,
                'span user-agent': str => str,
                'div screenshot-info': str => str,
                'a screenshot-path': str => str,
                'code': str => str,
                'code step-source': str => str,
                'span code-line': str => `${str}\n`,
                'span last-code-line': str => str,
                'code api': str => str,
                'strong': str => str,
                'a': str => str
            };
        },

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
            var aSteps = ui5Steps.getCurSteps(meta.TEST_CASE);
            var aStepsAdd = [];
            
            for (var i = 0; i < aSteps.length; i++) {
                aStepsAdd.push({
                    activity: aSteps[i].activity,
                    endTime: aSteps[i].endTime,
                    isFirstUI5Selector: aSteps[i].isFirstUI5Selector,
                    isUI5Selector: aSteps[i].isUI5Selector,
                    selector: aSteps[i].selector,
                    startTime: aSteps[i].startTime,
                    status: aSteps[i].status,
                    stepId: aSteps[i].stepId,
                    stepType: aSteps[i].stepType,
                    testName: aSteps[i].testName
                });
            }
            this.currentTestFixture.tests.push({
                meta: meta,
                name: name,
                testRunInfo: testRunInfo,
                steps: aStepsAdd,
                traceLog: ui5Steps.getTestIdErrorLog(meta.TEST_CASE),
                consoleErrorLog: ui5Steps.getCurConsoleErrorLogs()
            });
        },

        async reportTaskDone(endTime, passed, warnings, result) {
            if (this.currentTestFixture) {
                this.testResults.fixtures.push(this.currentTestFixture);
            }

            if (!ui5Config.rest || !ui5Config.rest.videoUrl || !ui5Config.rest.url || !ui5Config.rest.password || !ui5Config.rest.user) {
                return;
            }

            this.testResults.endTime = endTime;
            this.testResults.passed = passed;
            this.testResults.warnings = warnings;
            this.testResults.duration = this.testResults.endTime - this.testResults.startTime;
            this.testResults.passedCount = result.passedCount;
            this.testResults.failedCount = result.failedCount;
            this.testResults.skippedCount = result.skippedCount;
            this.testResults.product = '';
            this.testResults.testSystem = process.env.TEST_SYSTEM;
            this.testResults.runType = process.env.TEST_RUN_TYPE;

            if (this.testResults.fixtures && this.testResults.fixtures[0].meta && this.testResults.fixtures[0].meta.PRODUCT) {
                this.testResults.product = this.testResults.fixtures[0].meta.PRODUCT;
            } //gen videos..


            for (var i = 0; i < this.testResults.fixtures.length; i++) {
                var oCurFix = this.testResults.fixtures[i];

                for (let s in oCurFix.meta) {
                    oCurFix[s] = oCurFix.meta[s];
                }

                delete oCurFix.meta;

                for (var j = 0; j < oCurFix.tests.length; j++) {
                    var oCurTest = oCurFix.tests[j];

                    for (let sTst in oCurTest.meta) {
                        oCurTest[sTst] = oCurTest.meta[sTst];
                    }

                    delete oCurTest.meta;
                    oCurTest.durationMs = oCurTest.testRunInfo.durationMs;
                    oCurTest.testcafeId = oCurTest.testRunInfo.testId;
                    oCurTest.skipped = oCurTest.testRunInfo.skipped;
                    oCurTest.failed = oCurTest.testRunInfo.errs.length > 0;
                    oCurTest.passed = oCurTest.failed === false && oCurTest.skipped === false;

                    for (var x = 0; x < oCurTest.testRunInfo.videos.length && x < 1; x++) {
                        var sPath = oCurTest.testRunInfo.videos[x].videoPath; //const data = fs.readFileSync(sPath, 'utf8');

                        let formData = new FormData();

                        formData.append('video', fs.createReadStream(sPath), {
                            filename: 'test.mp4'
                        });
                        let aHeaders = formData.getHeaders();

                        aHeaders['filename'] = oCurTest.testRunInfo.testId;
                        await instance.post(ui5Config.rest.videoUrl, formData, {
                            headers: aHeaders,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            auth: {
                                username: ui5Config.rest.user,
                                password: ui5Config.rest.password
                            }
                        });
                    }

                    if (oCurTest.testRunInfo.videos.length > 0) {
                        oCurTest.video = oCurTest.testRunInfo.videos[0]; //we are only storing one video max per test (Which is anyways sufficient)
                    }

                    if (oCurTest.testRunInfo.errs.length > 0) {
                        oCurTest.errorDescr = this.formatError(oCurTest.testRunInfo.errs[0]);
                    }

                    delete oCurTest.testRunInfo;
                }
            }

            await instance.post(ui5Config.rest.url, this.testResults, {
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                auth: {
                    username: ui5Config.rest.user,
                    password: ui5Config.rest.password
                }
            });
        }
    };
};
