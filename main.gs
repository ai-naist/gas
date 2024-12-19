function run() {
  // allのフォルダーのIDを指定
  var folderId = '1sQkko0BHSb2kj7Et-xS1f_bFglcPlhL5';
  var parentFolder = DriveApp.getFolderById(folderId);
  // フォルダー内のサブフォルダーを取得
  var subfolders = parentFolder.getFolders();
  
  while (subfolders.hasNext()) {
    var subfolder = subfolders.next();
    addAudioFilesWithMetadataToList(subfolder.getId());
  }
  copyValuesToAllSheet();

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   // シートの一覧を取得
  var sheets = spreadsheet.getSheets();
  
  // シート名をループ処理する
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName();
    removeDuplicateRows(sheetName);
    createJsonFile(sheetName);
  }  
  createRootJson();

  return 0;
}