function addAudioFilesWithMetadataToList(folderId = '1sQkko0BHSb2kj7Et-xS1f_bFglcPlhL5') {
  const folder = DriveApp.getFolderById(folderId);
  const folderName = folder.getName();
  const sheetName = folderName;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log('新しいシートを作成しました: ' + sheetName);
  }

  const files = listFilesInFolder(folderId);
  const matchingFiles = sheet.getRange('A:A').getValues().flat().filter(value => value !== ''); // fileName
  const existingFiles = sheet.getRange('F:F').getValues().flat().filter(value => value !== ''); // fileId
  const rowsToAdd = [];
  let allFileId = new Set();

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    const fileId = file.getId();
    allFileId.add(fileId)

    if (fileName.endsWith('.mp3') && !existingFiles.includes(fileId)) {
      const fileUrl = file.getUrl();      
      if (matchingFiles.includes(fileName)){
        rowIndex = findRowNumber(sheet, 1, fileName);

        sheet.getRange('F' + rowIndex).setValue(fileId);
        sheet.getRange('G' + rowIndex).setValue(fileUrl);
        Logger.log('ファイルを更新しました: ' + fileName);
      }
      else{
        let metadata;
        try {
          metadata = getAudioMetadata(file);
        } catch (error) {
          Logger.log('メタデータの取得に失敗しました: ' + fileName + ' - ' + error);
          continue;
        }

        const trackName = truncateString(cleanString(String(metadata.trackName || '不明')), 30);
        const albumName = truncateString(cleanString(String(metadata.albumName || '不明')), 30);
        const artistName = truncateString(cleanString(String(metadata.artistName || '不明')), 30);
        const trackNumber = metadata.trackNumber || 0;

        rowsToAdd.push([fileName, artistName, albumName, trackNumber, trackName, fileId, fileUrl]);
        Logger.log('ファイルを追加しました: ' + fileName);
      }
    }
  }

  if (folderId != '1sQkko0BHSb2kj7Et-xS1f_bFglcPlhL5'){
    let removedFiles = existingFiles.filter(element => !allFileId.has(element));
    for (var i = 0; i < removedFiles.length; i++){
      var row = findRowNumber(sheet, 6, removedFiles[i]);
      Logger.log("ファイルがリストから削除されました: " + sheet.getRange(row, 1).getValue());
      sheet.deleteRow(row);
    }
  }

  if (rowsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
  }
}

// columnToSearch : 検索する列（1はA列、2はB列など）
function findRowNumber(sheet, columnToSearch, searchValue) {
  var data = sheet.getRange(1, columnToSearch, sheet.getLastRow(), 1).getValues(); // 対象列のデータのみを取得
  // 一致する行番号を検索
  var rowIndex = 1 + data.findIndex(function(row) {
    return row[0] === searchValue; // 一致条件
  });
  return rowIndex;
}

function listFilesInFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const fileArray = [];

  // フォルダー内のファイルを取得
  while (files.hasNext()) {
    fileArray.push(files.next());
  }

  // サブフォルダー内のファイルを再帰的に取得
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    const subfolderFiles = listFilesInFolder(subfolder.getId());
    // subfolderFiles のファイルを配列として追加
    while (subfolderFiles.hasNext()) {
      fileArray.push(subfolderFiles.next());
    }
  }

  // イテレーターを返すために新しいイテレーターオブジェクトを作成
  return {
    index: 0,
    array: fileArray,
    hasNext: function() {
      return this.index < this.array.length;
    },
    next: function() {
      return this.array[this.index++];
    }
  };
}


// メタデータを取得する関数
function getAudioMetadata(file) {
  let metadata = {
    trackName: null,
    albumName: null,
    artistName: null,
    trackNumber: null,
  };

  // MP3ファイルのメタデータを解析する
  if (file.getName().endsWith('.mp3')) {
    const mp3Data = parseMp3Metadata(file); // MP3メタデータを取得する関数
    metadata.trackName = mp3Data.trackName;
    metadata.albumName = mp3Data.albumName;
    metadata.artistName = mp3Data.artistName;
    metadata.trackNumber = mp3Data.trackNumber;
  }
  // AACファイルのメタデータを解析する
  if (file.getName().endsWith('.m4a')) {
    const aacData = parseAACMetadata(file); // AACメタデータを取得する関数
    metadata.trackName = aacData.trackName;
    metadata.albumName = aacData.albumName;
    metadata.artistName = aacData.artistName;
    metadata.trackNumber = aacData.trackNumber;
  }

  return metadata;
}

// MP3メタデータを取得する関数
function parseMp3Metadata(file) {
  const blob = file.getBlob();
  const bytes = blob.getBytes();
  
  // ID3v1タグはファイルの末尾に位置している
  const id3TagLength = 128; // ID3v1タグの長さ
  const start = bytes.length - id3TagLength;
  
  // ID3v1タグを読み取り
  const id3Tag = bytes.slice(start);
  
  // タグが適切か確認
  const tagHeader = String.fromCharCode.apply(null, id3Tag.slice(0, 3));
  if (tagHeader !== 'TAG') {
    return { trackName: null, albumName: null, trackNumber: null, artistName: null }; // ID3v1タグが見つからない場合
  }

  // タグ情報を取得してShift JISでデコード
  const trackName = decodeShiftJIS(id3Tag.slice(3, 33)).trim();
  const albumName = decodeShiftJIS(id3Tag.slice(63, 93)).trim();
  const artistName = decodeShiftJIS(id3Tag.slice(33, 63)).trim();
  
  // トラックナンバーを取得 (ID3v1ではトラック番号は位置 126 に格納)
  const trackNumber = id3Tag[126] !== 0 ? id3Tag[126] : null; // トラック番号が存在する場合のみ取得

  return {
    trackName: trackName, // そのまま返す
    albumName: albumName,   // そのまま返す
    artistName: artistName, // アーティスト名を返す
    trackNumber: trackNumber // トラックナンバーを返す
  };
}


// Shift JISでデコードする関数
function decodeShiftJIS(bytes) {
  const blob = Utilities.newBlob(bytes);
  return blob.getDataAsString('Shift_JIS');
}

// 文字列を指定した文字数で切り取る関数
function truncateString(str, maxLength) {
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

// 文字列から不要な文字を取り除く関数
function cleanString(str) {
  // トリミングと無効な文字の削除（日本語を保持）
  return str.replace(/[\x00-\x1F\x7F-\xFF\uFFFD]/g, '').trim(); // 制御文字や無効な文字を削除
}

function getReplayGainFromMp3(mp3FileId) {
  // Google DriveのファイルIDを指定
  var file = DriveApp.getFileById('1WTwDKZXivJbC5byur1nohx_wXa775eR7');
  
  // ファイルのバイナリデータを取得
  var bytes = file.getBlob().getBytes();

  // ID3タグの開始を確認（"ID3"のバイトシーケンス）
  if (String.fromCharCode(bytes[0], bytes[1], bytes[2]) !== "ID3") {
    Logger.log("ID3v2タグが見つかりません。");
    return null;
  }

  // ID3タグのサイズを取得
  var tagSize = ((bytes[6] & 0x7F) << 21) | ((bytes[7] & 0x7F) << 14) |
                ((bytes[8] & 0x7F) << 7) | (bytes[9] & 0x7F);

  // 10バイトのヘッダーの後からフレームをパース
  var index = 10;
  while (index < tagSize) {
    var frameId = String.fromCharCode(bytes[index], bytes[index + 1], bytes[index + 2], bytes[index + 3]);
    var frameSize = (bytes[index + 4] << 24) | (bytes[index + 5] << 16) |
                    (bytes[index + 6] << 8) | bytes[index + 7];
    
    // 「TXXX」フレームを見つけたら解析
    if (frameId === "TXXX") {
      var description = "";  // 説明部分の取得
      var i = index + 10;
      
      // テキストエンコーディングをスキップし、説明テキストを抽出
      i += 1;
      while (bytes[i] !== 0 && i < index + 10 + frameSize) {
        description += String.fromCharCode(bytes[i]);
        i++;
      }

      // 必要なReplayGainタグかを確認し、値を抽出
      if (description === "replaygain_track_gain") {
        var replayGainValue = "";
        i += 1; // 説明と値の区切りヌル文字をスキップ
        while (i < index + 10 + frameSize) {
          replayGainValue += String.fromCharCode(bytes[i]);
          i++;
        }
        Logger.log(description + ": " + replayGainValue);
        return replayGainValue;
      }
    }
    
    // 次のフレームに移動
    index += 10 + frameSize;
  }

  Logger.log("ReplayGain情報が見つかりません。");
  return null;
}

