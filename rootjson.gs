function createRootJson() {
  // 対象のフォルダIDを指定
  var folderId = '1MpWEqF71wFybu5AiSwKs2Q4SJJRQlWaL'; // ここにフォルダIDを入力
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();
  
  var playlists = {};
  
  while (files.hasNext()) {
    var file = files.next();
    // 拡張子を除いたファイル名を取得
    var fileNameWithoutExtension = file.getName().replace(/\.[^/.]+$/, "");
    playlists[fileNameWithoutExtension] = file.getId();
  }
  
  var jsonOutput = {
  playlists: playlists
  };

  // JSONを文字列に変換
  var jsonString = JSON.stringify(jsonOutput, null, 2);

  // フォルダ内に同名のファイルがあるか確認
  var rootfolder = DriveApp.getFolderById('1DOp0zNWqJ-ElZb36vZsI2ffdRgiR53Vb');
  
  // JSONファイルを取得または作成
  var jsonFile;
  var existingFiles = rootfolder.getFilesByName("root.json");
  
  if (existingFiles.hasNext()) {
    jsonFile = existingFiles.next();
    jsonFile.setContent(jsonString); // 既存ファイルを上書き
  } else {
    jsonFile = folder.createFile(jsonFileName, jsonString, MimeType.PLAIN_TEXT); // 新規作成
  }
  // playlists の名前を取得
  var names = Object.keys(jsonOutput.playlists);
  Logger.log('rootJSONファイルが更新されました: ' + names);
}