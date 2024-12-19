function copyValuesToAllSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allSheet = spreadsheet.getSheetByName('all');
  
  // シート名「all」以外のすべてのシートを取得
  const sheets = spreadsheet.getSheets().filter(sheet => sheet.getName() !== 'all');
  
  // 新しいデータを格納するための配列
  let allData = [];
  
  sheets.forEach(sheet => {
    const data = sheet.getDataRange().getValues();
    allData = allData.concat(data); // データを結合
  });
  
  // 「all」シートをクリア
  allSheet.clear();
  
  // データが存在する場合のみ設定
  if (allData.length > 0) {
    const maxColumns = Math.max(...allData.map(row => row.length)); // 最大列数を取得
    allSheet.getRange(1, 1, allData.length, maxColumns).setValues(allData.map(row => {
      // 各行の列数を最大列数に合わせて調整
      return [...row, ...Array(maxColumns - row.length).fill('')];
    }));
  }
}

function removeDuplicateRows(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("指定されたシートが見つかりません: " + sheetName);
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var uniqueData = [];
  var seen = {};

  for (var i = 0; i < data.length; i++) {
    var row = data[i].join(); // 行を文字列に変換
    if (!seen[row]) {
      uniqueData.push(data[i]);
      seen[row] = true; // この行を記録
    }
  }

  // シートをクリアして、ユニークなデータを書き込む
  sheet.clear();
  sheet.getRange(1, 1, uniqueData.length, uniqueData[0].length).setValues(uniqueData);

  // 結果をソートする
  sortData(sheetName)
}

function sortData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var range = sheet.getDataRange(); // データ範囲を取得

  // D列でソート（4列目）
  range.sort({column: 4, ascending: true});

  // 再度データ範囲を取得（D列でソートされた後）
  range = sheet.getDataRange();
  
  // C列でソート（3列目）
  range.sort({column: 3, ascending: true});

  // 再度データ範囲を取得（C列でソートされた後）
  range = sheet.getDataRange();
  
  // B列でソート（2列目）
  range.sort({column: 2, ascending: true});
}



