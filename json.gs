function createJsonFile(sheetName) {
  // const sheetName = 'all'; // シート名を指定（プレイリスト名）

  const sheetId = '1BuSWk7Pj1ypjrfWABJ_1kAHZQwo8ErkapxpXbDrSmvA';

  // スプレッドシートをIDから取得
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName(sheetName);

  // シートが存在しない場合の処理
  if (!sheet) {
    Logger.log('指定されたシートが見つかりません: ' + sheetName);
    return;
  }

  var data = sheet.getDataRange().getValues();

  var jsonArray = [];
  
  // データをJSON形式に変換（[4]のinfoと[5]のidを取得）
  for (var i = 0; i < data.length; i++) {
    var jsonObject = {
      info: data[i][4], // [4]の列をinfoとして
      id: data[i][5]    // [5]の列をidとして
    };
    jsonArray.push(jsonObject);
  }
  
  // JSONデータを文字列に変換
  var jsonString = JSON.stringify(jsonArray, null, 2);
  
  // 保存先のフォルダのIDを取得
  var folderId = '1MpWEqF71wFybu5AiSwKs2Q4SJJRQlWaL'; // jsonフォルダのIDをここに入力
  var folder = DriveApp.getFolderById(folderId);
  
  // JSONファイルの名前を設定
  var fileName = sheetName + '.json';
  
  // フォルダ内に同名のファイルがあるか確認
  var files = folder.getFilesByName(fileName);
  
  if (files.hasNext()) {
    // 同名のファイルが存在する場合、上書き
    var file = files.next();
    file.setContent(jsonString);
    Logger.log('jsonファイルが上書きされました: ' + file.getName());
  } else {
    // 同名のファイルが存在しない場合、新規作成
    var file = folder.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
    Logger.log('jsonファイルが作成されました: ' + file.getName());
  }
}
