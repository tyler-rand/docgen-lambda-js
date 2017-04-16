var DocxGen   = require('docxtemplater');
var ImgModule = require('docxtemplater-image-module');
var AWS       = require('aws-sdk');
var s3        = new AWS.S3();
var ses       = new AWS.SES();
// ---------------------------------
exports.handler = function(event, context) {
  console.log('received event: ' + JSON.stringify(event));

  var userId       = event.userId;
  var bucket       = event.bucket;
  var templateName = event.templateName;
  var imageName    = event.imageName;
  var documentName = event.documentName;

  function getTemplate(callback) {
    var params = {
      Bucket: bucket,
      Key: userId + '/templates/' + templateName
    };

    s3.getObject(params, function(err, data) {
      if (err) {
        console.log('s3 get template err' + err + err.stack);
        sendError('Failed to get template from S3', JSON.stringify(err));
      }
      else {
        console.log('get template success');
        callback(data, renderDoc);
      }
    });
  }

  function getImage(template, callback) {
    if (imageName) {
      var params = {
        Bucket: bucket,
        Key: userId + '/images/' + imageName
      };

      s3.getObject(params, function(err, data) {
        if (err) {
          console.log('s3 get image err' + err + err.stack);
          sendError('Failed to get signature image from S3', JSON.stringify(err));
        }
        else {
          console.log('get image success');
          template.image = data;
          callback(template, saveDoc);
        }
      });
    } else {
      callback(template, saveDoc);
    }
  }

  function renderDoc(data, callback) {
    console.log('start renderDoc func');
    var options = {
      centered: false,
      getImage: function(tagValue) { return data.image.Body; },
      getSize: function(img) { return [260, 80]; }
    }

    var imgModule = new ImgModule(options);
    var doc = new DocxGen()
      .attachModule(imgModule)
      .load(data.Body)
      .setData(event.data)
      .render();

    var buf = doc.getZip().generate({type: 'nodebuffer'});
    callback(buf);
  }

  function saveDoc(reportBuf) {
    console.log('start saveDoc func');
    var date = new Date(Date.now());
    var datesFolders = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '/';
    var keyName = userId + '/documents/' + datesFolders + documentName;
    var params = {
      Bucket: bucket,
      Key: keyName,
      Body: reportBuf,
      ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    s3.upload(params, function(err, data) {
      if (err) {
        console.log('s3 putObj error' + err);
        sendError('Failed to save report to S3', JSON.stringify(err));
      }
      else {
        console.log('upload success');
        context.succeed(data.Location);
      }
    });
  }

  function sendError(msg, errorBody) {
    var params = {
      Destination: { ToAddresses: [''] },
      Message: {
        Subject: { Data: 'Lambda::DocGen Error - Time:' + Date.now() },
        Body: {
          Text: { Data: msg + '\n\n' + errorBody }
        },
      },
      Source: ''
    };

    ses.sendEmail(params, function(err, data) {
      if (err) {
        console.log('error sending error email' + err + err.stack);
        context.fail('failed to send error email');
      }
      else {
        console.log('sent error email');
        context.succeed('sent error email');
      }
    });
  }

  getTemplate(getImage);
}

