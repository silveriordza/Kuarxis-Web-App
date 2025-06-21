/** @format */

let { LogThisLegacy } = require("./Logger");

const rowCleaner = (rowToClean) => {
  let Row1Clean = rowToClean;

  let quotesCount = 0;
  let semiColonChar = ";";
  const rowArray = Row1Clean.split("");
  for (let i = 0; i < rowArray.length; i++) {
    if (rowArray[i] == '"') {
      if (quotesCount == 0) {
        //console.log(`opening quotes identified at column i=${i}`);
        quotesCount++;
      } else {
        //console.log(`closing quotes  identified at column i=${i}`);
        quotesCount--;
      }
    } else {
      if (quotesCount > 0 && rowArray[i] == ",") {
        //console.log(`replacing comma at column i=${i}`);
        rowArray[i] = semiColonChar;
        //console.log(`replaced comma at column i=${i}`);
      }
    }
  }
  rowArray[rowArray.length] = "\n";
  return rowArray.join("");
};

const saveStringAsCSV = (stringData, fileName) => {
  const blob = new Blob([stringData], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const convertSurveyJsonToCSV = (headersJson, dataJson, dataRealJson) => {
  objLogSettings.sourceFilename = "csvProcessingLib.js";
  objLogSettings.sourceFunction = "convertSurveyJsonToCSV";
  LogThisLegacy(objLogSettings, `START`);

  let csvText = "";

  for (let i = 0; i < headersJson.length - 1; i++) {
    csvText = csvText + headersJson[i] + "_Real" + ",";
  }
  csvText = csvText + headersJson[headersJson.length - 1] + "_Real" + ",";
  LogThisLegacy(objLogSettings, `REAL headers csvText = ${csvText}`);
  for (let i = 0; i < headersJson.length - 1; i++) {
    csvText = csvText + headersJson[i] + "_Numerico" + ",";
  }

  csvText = csvText + "Numerico_" + headersJson[headersJson.length - 1]; //  + '\r\n'
  csvText = csvText.replace(/\n/g, "");
  csvText = csvText.replace(/\r/g, "");
  csvText = csvText + "\r\n";
  LogThisLegacy(objLogSettings, `Numerico headers csvText = ${csvText}`);
  let i = 0;
  let csvRow = "";

  // dataRealJson.forEach(dataRealRow => {
  //   csvRow = dataRealRow + ',' + dataJson[i]
  //   csvRow =  csvRow.replace(/\n/g, '')
  //   csvRow =  csvRow.replace(/\r/g, '')

  //   csvText = csvText + csvRow + '\r\n'

  //   i++
  // })
  for (let i = 0; i < dataRealJson.length; i++) {
    csvRow = dataRealJson[i] + "," + dataJson[i];
    csvRow = csvRow.replace(/\n/g, "");
    csvRow = csvRow.replace(/\r/g, "");
    csvRow = csvRow.replace(/\r\n/g, "");
    csvText = csvText + csvRow + "\r\n";
  }
  LogThisLegacy(objLogSettings, `Final csvText = ${csvText}`);

  return csvText;
};

module.exports = {
  rowCleaner,
  saveStringAsCSV,
  convertSurveyJsonToCSV,
};
