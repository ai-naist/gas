let isProcessing = false;

function doGet(e) {
  if (isProcessing) {
    return ContentService.createTextOutput("現在処理中です。少々お待ちください。");
  }
  isProcessing = true;

  try{
    // ログの初期化
    Logger.clear();
    
    // run 関数を実行
    var result = run();
    
    // ログの内容を取得
    var logOutput = Logger.getLog();
    
    // HTML 形式でレスポンスを作成
    var htmlOutput = `
      <html>
        <head>
          <title>Log Results</title>
        </head>
        <body>
          <h1>Execution Result</h1>
          <p>${result}</p>
          <h2>Logs</h2>
          <pre>${logOutput}</pre>
        </body>
      </html>
    `;
    
    // HTML レスポンスを返す
    return ContentService.createTextOutput(htmlOutput).setMimeType(ContentService.MimeType.HTML);

  } finally {
    isProcessing = false;
  }
}