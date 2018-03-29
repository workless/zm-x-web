## Instructions

To run the tests against local development server, make sure the server is up & running before starting the test run. See zm-x-web project README file for more details.

To run the tests against Netlify master/deploy preview build, change the host URL to the required URL in `tests/e2e/testcafe/profile/default.json` file and then start the test.

Then to run the tests, issue the following command:
`testcafe <browser> <testFile>.js -e`

Following are the optional parameters that can be passed along with the command:
 ```
 -e                         \\ Prevents tests from failure when a JavaScript error occurs on a tested web page.
 --profile=default          \\ To specify a profile.
 --selector-timeout 50000   \\ To override default selector timeout
 -T "tests regex"           \\ To run tests whose names match the specified pattern
 -F "fixtures regex"        \\ To run fixtures whose names match the specified pattern.
 ```

Example - `testcafe chrome contacts.js --profile=default --selector-timeout 50000 -T "-tag"`

See more TestCafe command line options here - https://devexpress.github.io/testcafe/documentation/using-testcafe/command-line-interface.html
