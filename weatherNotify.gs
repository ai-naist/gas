function doPost(e) {
  // iPhone（ショートカット）から送られてきた位置情報を取得
  var params = JSON.parse(e.postData.getDataAsString());
  var locationData = params.location;
  // ショートカットに返すメッセージを格納する為の変数
  var result = {};
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // 位置情報が問題なく送られてきてるかの判定
  if (locationData){
    result = {
      "success" : {
        "message" : "Success"
      }
    };
    // 位置情報があればスプレッドシートへ記録する
    addLog( JSON.stringify(locationData) );
  } else {
    result = {
      "error": {
        "message": "No Data"
      }
    };
  }

  // ショートカットにメッセージを返す
  output.setContent(JSON.stringify(result));
  return output;
}

function addLog(text) {
  // 記録するスプレッドシートを指定
  var spreadsheetId = "1f20hsnXVQKhS3vXwU2TE2riwP23_54p0sGFmIq2M_P4"; // スプレッドシートID
  var sheetName     = "location"; // スプレッドシート名
  var spreadsheet   = SpreadsheetApp.openById(spreadsheetId);
  var sheet         = spreadsheet.getSheetByName(sheetName);
  var range         = sheet.getRange("A1");
  // 記録する箇所の列幅を指定
  // var firstColumnSize  = 150; // １列目の列幅
  // var secondColumnSize = 350; // ２列目の列幅
  // sheet.setColumnWidth(1,firstColumnSize);
  // sheet.setColumnWidth(2,secondColumnSize);
  // ショートカットから送信された位置情報をスプレッドシートに記録
  // sheet.appendRow([new Date(),text]);
  range.setValue(text.slice(1,-1));
  // range = sheet.getDataRange();
  // range.setHorizontalAlignment("left"); // 文字を左揃えに統一
}

// main
function getYahooWeather(){
  var status = "start";
  var now = new Date();
  var location = getLocation();
  var last = new Date(location[1]);
  var elapsedtime = now.getTime() - last.getTime();

  status = "within 1 hours";
  if ( elapsedtime > 1*60*60*1000){// over 1 hours
    var url = "https://map.yahooapis.jp/weather/V1/place?past=1&output=json&appid=dj00aiZpPTI2SWVaUWtsZTVjTSZzPWNvbnN1bWVyc2VjcmV0Jng9MTI-&coordinates=" + location[0];
    var responseData = UrlFetchApp.fetch(url).getContentText();
    var json = JSON.parse(responseData);
    var weather = json["Feature"][0]["Property"]["WeatherList"]["Weather"];
    Logger.log(weather);
    var cRainObservation = 0;
    for (let i=0; i<=6; i++){
      if (weather[i]["Rainfall"] >= 0.3){
        cRainObservation ++;
      }
    }
    // Logger.log(cRainObservation)

    status = "keep raining"
    if (cRainObservation == 0 || elapsedtime > 6*60*60*1000 || now.getHours()==8){
      var dateRain = 0;
      var maxRainfall = 0;
      var cRainTimes = 0;
      for (let i=7; i<=12; i++){
        if (weather[i]["Rainfall"] >= 0.3){
          cRainTimes++;
          if (cRainTimes == 1){
            maxRainfall = weather[i]["Rainfall"];
            dateRain = weather[i]["Date"];
          }
          else if(maxRainfall < weather[i]["Rainfall"]){
            maxRainfall = weather[i]["Rainfall"];
          }
        }
      }
      // Logger.log(dateRain)
      status = "no rain forecast"
      if (cRainTimes >= 2){
        var date = numberDate(dateRain);
        var place = getPlace(location[0]);
        sendLineNotify(elapsedtime,date,place,maxRainfall,cRainTimes);
        loadTime();
        status = "notification complete"
      }
    }
  }
  Logger.log(status);
}

function numberDate(numDate){
  var strDate = String(numDate);
  var listDate = [];
  for (let i=0; i<3; i++){
    listDate.push(strDate.slice(4*i,4*(i+1)));
    if (i>0){
      let temp = listDate.pop();
      for (let j=0; j<2; j++){
        listDate.push(String(Number(temp.slice(2*j,2*(j+1)))));
      }
    }
  }
  var date = new Date(listDate[0]+"/"+listDate[1]+"/"+listDate[2]+" "+listDate[3]+":"+listDate[4]);
  var time = date.toLocaleTimeString("ja-JP",{hour:"numeric",minute:"2-digit"});
  // Logger.log(time);
  return time;
}

function getLocation(){
  var spreadsheetId = "1f20hsnXVQKhS3vXwU2TE2riwP23_54p0sGFmIq2M_P4"; // スプレッドシートID
  var sheetName     = "location"; // スプレッドシート名
  var spreadsheet   = SpreadsheetApp.openById(spreadsheetId);
  var sheet         = spreadsheet.getSheetByName(sheetName);
  var range         = sheet.getRange("A1:B1");
  var value         = range.getValues();
  // Logger.log(value[0]);
  return value[0];
}

function loadTime(){
  var spreadsheetId = "1f20hsnXVQKhS3vXwU2TE2riwP23_54p0sGFmIq2M_P4"; // スプレッドシートID
  var sheetName     = "location"; // スプレッドシート名
  var spreadsheet   = SpreadsheetApp.openById(spreadsheetId);
  var sheet         = spreadsheet.getSheetByName(sheetName);
  var range         = sheet.getRange("B1");
  var date          = new Date();
  range.setValue(date);
}

function getPlace(coordinates){
  var lnglat = coordinates.split(",");
  var geocoder = Maps.newGeocoder();
  geocoder.setLanguage("ja"); // 日本語
  var response = geocoder.reverseGeocode(lnglat[1],lnglat[0]);
  // Logger.log(response);
  var location = response.results[0].formatted_address;
  // Logger.log(location);
  for (let value of response.results[0].address_components){
    if (value.types.includes("administrative_area_level_1")){
      var prefecture = value.long_name;
      location = location.split(prefecture);
      location = location.pop();
      location = location.split(/[0-9０-９]/,1);
      location = location.shift();
      if (location.length <= 6){
        location = prefecture + location;
      }
       break;
    }
  }
  // Logger.log(location);
  return location;
}

function sendLineNotify(elapsedtime,date,location,rainfall,times){
  if (rainfall<0.5){
    var condition = "霧"
  }
  else if(rainfall<0.7){
    var condition = "弱い"
  }
  else if(rainfall<2){
    var condition = "傘の要る"
  }
  else if(rainfall<4){
    var condition = "本格的な"
  }
  else if(rainfall<7){
    var condition = "強い"
  }
  else if(rainfall<20){
    var condition = "激しい"
  }
  else if(rainfall<50){
    var condition = "強烈な"
  }
  else{
    var condition = "災害級の"
  }

  var message = "\n" + date + " から " + condition + "雨 の予報\n" + location + " 付近";
  var token = "jHTsvWqt7jHFZd59q8bLCzlrhlee7C70axLUgYekPrb";
  var url = "https://notify-api.line.me/api/notify";
  var headers = {
    "Authorization" : "Bearer " + token
  };
  var formData = {
    "message" : message
  };
  if (rainfall<1 || times<3 || elapsedtime<4*60*60*1000){
    formData["notificationDisabled"] = true;
  }
  // HTTP POST REQUEST OPTIONS
  var options = {
    "headers" : headers,
    "method" : "post",
    "payload" : formData
  };
  var responseData = UrlFetchApp.fetch(url,options).getContentText();
  Logger.log(responseData);
}