function doPost(e){
  // postされたjsonファイルの取得
  var params = JSON.parse(e.postData.getDataAsString());
  var result = {};

  if (params){
    result = {
      "success" : {
        "message" : "Success"
      }
    };

    if(params.user){
      var name = params.user;
      var status = params.status;
      sendLineNotify(name,status);
      logData(name,status);
    };

  } else {
    result = {
      "error": {
        "message": "No Data"
      }
    };
  }

  // PSにメッセージを返す  
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(result));
  return output;
}

function sendLineNotify(name,status){
  var token = "0rWNmB3g9nB1X1JnXeIuEgos6c0YV3RrHiNUbZiLDL3";
  var url = "https://notify-api.line.me/api/notify";
  var headers = {
    "Authorization" : "Bearer " + token
  };
  var formData = {
    "message" : "\n" + name + "\n" + "(" + status + ")"
  };
  // HTTP POST REQUEST OPTIONS
  var options = {
    "headers" : headers,
    "method" : "post",
    "payload" : formData
  };
  if (status=="wake"){
    formData["notificationDisabled"] = true;
    //Logger.log(formData);
  };
  var responseData = UrlFetchApp.fetch(url,options).getContentText();
}

function logData(name,status){
  // 記録するスプレッドシートを指定
  var spreadsheetId = "15ZwUSqQdSTG1_1QbE3kmRnpsElADfRWuE99LwVSwolU"; // スプレッドシートID （シートのURL）
  var sheetName     = "log"; // スプレッドシート名
  var spreadsheet   = SpreadsheetApp.openById(spreadsheetId);
  var sheet         = spreadsheet.getSheetByName(sheetName);

  // 行の追加
  sheet.insertRowBefore(1);
  var now           = new Date();
  var data          = [[now,name,status]]
  var range         = sheet.getRange("A1:C1");
  range.setValues(data);

  // 1001件以上のlogを削除
  while(sheet.getLastRow() >= 1001){
    sheet.deleteRow(1001);
  };

}

function recordData(data){
  // 記録するスプレッドシートを指定
  var spreadsheetId = "15ZwUSqQdSTG1_1QbE3kmRnpsElADfRWuE99LwVSwolU"; // スプレッドシートID （シートのURL）
  var sheetName     = "log"; // スプレッドシート名
  var spreadsheet   = SpreadsheetApp.openById(spreadsheetId);
  var sheet         = spreadsheet.getSheetByName(sheetName);

  // 行の追加
  sheet.insertRowBefore(1);
  var range         = sheet.getRange("B1");
  range.setValue(data);
}

function selfMaintenance(){
  var url = "https://script.google.com/macros/s/AKfycbwF_8_HzRgktuOevCko_cDx1rcKe7unNmpGiJ9KUL0wm3iiLzoHtoABOXpahwdAX76a/exec"
  var data =
   {
    
   };
  var options = {
    "method" : "post",
    "Content-Type": "application/json",
    "payload": JSON.stringify(data)
  };  
  var responseData = UrlFetchApp.fetch(url,options).getContentText();
  Logger.log(responseData);
}

function doPostTest() {
  //eの作成
  var e = {
    postData : Utilities.newBlob('この中にJSONデータを入れる')
  };
  //呼び出す。
  doPost(e);
}
