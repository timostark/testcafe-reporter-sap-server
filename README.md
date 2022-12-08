# testcafe-reporter-sap-server
[![Build Status](https://travis-ci.org/techmuc/testcafe-reporter-sap-server.svg)](https://travis-ci.org/techmuc/testcafe-reporter-sap-server)

This is the **sap-server** reporter plugin for [TestCafe](http://devexpress.github.io/testcafe).

<p align="center">
    <img src="https://raw.github.com/techmuc/testcafe-reporter-sap-server/master/media/preview.png" alt="preview" />
</p>

## Install

```
npm install testcafe-reporter-sap-server
```

## Usage

When you run tests from the command line, specify the reporter name by using the `--reporter` option:

```
testcafe chrome 'path/to/test/file.js' --reporter sap-server
```


When you use API, pass the reporter name to the `reporter()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('chrome')
    .reporter('sap-server') // <-
    .run();
```

## Author
STARTIM 
