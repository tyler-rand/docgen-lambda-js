# docgen-lambda-js

Part of my DocGen rails project, this node.js code lives in an Amazon Lambda function and is invoked after a user has made an successful authenticated API request to the Rails server.


## Input

The function is expecting the following JSON input structure:
```javascript
module.exports = {
  "userId": "365425",
  "bucket": "dg-24352436",
  "templateName": "report_card_template.docx",
  "documentName": "Tyler_Rand_report_card.docx",
  "imageName": "dynamic_image.png",
  "data": {
    // any dynamic fields set in the template doc
    "firstName": "Tyler",
    "lastName": "Rand",
    "grade": "Missing"
  }
};
```

## Output

From the given inputs, the function first fetches a template document and image from the user's S3 bucket.

Then it creates a new document of the template with the image and all dynamic fields specified in the `data` hash merged in.

![Template](https://cloud.githubusercontent.com/assets/4617055/25068647/9cf1d3fa-2238-11e7-92ac-7047ff8a5001.png "Template") &nbsp;&nbsp;&nbsp;&nbsp;![fancy arrow](https://cloud.githubusercontent.com/assets/4617055/25068698/1721d7be-223a-11e7-8938-ac4cae1e8897.png "fancy arrow") &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;![Rendered Document](https://cloud.githubusercontent.com/assets/4617055/25068648/9d0245f0-2238-11e7-8030-9a126749bb51.png "Rendered Document")

