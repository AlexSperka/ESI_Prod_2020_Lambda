# Enterprise Software Implementation Lambda 2020

This project deals with the digitalisation and automation of a fictitious medium-sized production company and has the goal to improve processes and transparency for the customer (company).

This repository is meant for a clean versioning and development of several lambda functions.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

- https://nodejs.org/en/download/
- https://www.npmjs.com/get-npm (Alternative is yarn)
- https://pip.pypa.io/en/stable/installing/
- Editor, for example https://code.visualstudio.com/ with AWS Plugin

You will also need Accounts for:
- https://portal.aws.amazon.com/gp/aws/developer/registration/index.html
- https://developer.okta.com/

Useful development notes for working serverless with AWS CLI: 
•	https://serverless-stack.com/chapters/configure-the-aws-cli.html

### Installing & Deployment
Repeat these steps for every lambda function you would like to setup in the AWS environment!
- Go to the project directory (example lambda function "production/sortOrders" and type "npm install". This will install all needed depenencies required in the package.json file. 
- If you would like to setup a new lambda function please create a new folder and an index.js and package.json file similar to the others and run the npm command. 
Depending on how comfortable you are using command line tools and interfaces here are two ways of setting up your lambda functions:
- Alternative 1: To publish your code on the lambda instance you can configure your AWS CLI to update it directly from your editor (Visual Studio Code). See AWS and serverless documentation for help. Make sure to add the environment variables.
- Alternative2: You can as well setup a lambda function in the AWS console directly ( https://eu-central-1.console.aws.amazon.com/lambda/home?region=eu-central-1#/functions ), give it the role you are comfortable with and setup the environment variables. Afterwards you can take all the files in your lambda directory (index, package, nodemodules, ...), ZIP them and upload them to your lambda function manually.

## Environment Variables in Lambda Function
Make sure to exchange the values with the ones of your RDS database hosted on AWS before adding them to the lambda function!                
  
| Key | Value (Example)  |
| ------- | --- |
| RDS_DATABASE | production |
| RDS_LAMBDA_HOSTNAME | DBNAME.abcdefghij.eu-central-1.rds.amazonaws.com |
| RDS_LAMBDA_PASSWORD | ThisIsYourPW! |
| RDS_LAMBDA_PORT | 3306 |
| RDS_LAMBDA_USERNAME | root |

## Running the tests

As soon as the lambda function you setup is up and running you can do tests with it, either locally or in the AWS console. You can find the json objects for the tests in the corresponding folder of the lambda function named "test.json". This way you can check if the response of your function is correct.

## Versioning

This is a prototype state!

## Authors

* **Alex Sperka** - *Initial work*


## Acknowledgments

* Hat tip to anyone whose code was used
