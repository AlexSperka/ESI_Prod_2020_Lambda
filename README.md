# Enterprise Software Implementation Lambda 2020

This project deals with the digitalisation and automation of a fictitious medium-sized production company and has the goal to improve processes and transparency for the customer (company).

This repository is meant for a clean versioning and development of several lambda functions. The repository is not meant for the direct deployment of your lambda functions, you have to install dependencies first and setup your lambda functions, please see instructions below.

## Lambda Function
| Function | Description  |
| ------- | --- |
| addQualityValue (POST) | Is called by production frontend via API Gateway and retrives quality values of delivered material from material department (call their REST API) |
| createCSV (POST) | Called by backend sortOrders lambda function via API Gateway, gets orders sorted by color and exports them to CSV file in S3-Bucket. Returns URL |
| createOrders (POST) | Is called by sales departement frontend, adds new order (and suborders) to production database, returns new production order number for identification |
| orderRessources (POST) | Prototype function for later implementation, waiting for connection to material departement (not available yet) |
| readOrderInfo (GET & POST)| Gets called by material departement or production frontend. Depending on the input parameters returns all orders in database, filtered orders by production status or one specific order by prodOrderNum |
| sortOrders (POST) | Gets called by production frontend via API Gateway, input parameters are prodOrderNumbers which user wants to export to CSV. Data from Database for these numbers is extraced and lambda function createCSV gets called. Returns S3 Bucket URL for download. |
| updateProdStatus (POST) | Is called by several functions each time an order finishes one production step and should be updated to next stage. |

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

Next step will be to setup and configure the REST API Gateway on AWS to get access to your lambda functions. Repeat this for each lambda function.
- See the tutorial for first steps https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-getting-started-with-rest-apis.html
- Add the Functions you see in the "Lambda Function"-Section (keep an eye on the methods, GET, POST), you can use the same names if you would like. Then connect the corresponding lambda function to the api call. If done correctly, you now should be able to call the function with a tool like swagger.
- Alternatively, you can import the API from the swagger.yaml file and then connect the lambda functions to the API.

Last step will be to setup the frontend, exchange the base URL of the API Gateway and test it out! More detail on this you can find in the ESI_PROD_2020_REACT.

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
