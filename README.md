# Enterprise Software Implementation Lambda 2020

This project deals with the digitalisation and automation of a fictitious medium-sized production company and has the goal to improve processes and transparency for the customer (company).

This repository is meant for a clean versioning and AWS CLI development of several lambda functions.

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

### Installing

- Configure the .env file with your API parameters
- Go to the project directory (example lambda function "production/sortOrders" and type "npm install". This will install all needed depenencies required in the package.json file. If you would like to setup a new lambda function please create an index.js and package.json file similar to the others and run the npm command. To publish your code on the lambda instance you can either configure your AWS CLI to update it directly from your editor (Visual Studio Code) and or you can take all the files in your directory (index, package, nodemodules, ...), ZIP them and upload them to your lambda function manually.

## Running the tests

TBD

## Deployment

TBD

## Versioning

This is a prototype state!

## Authors

* **Alex Sperka** - *Initial work*


## Acknowledgments

* Hat tip to anyone whose code was used
