function saveAirQualityData(latitude, longitude) {
  var apiKey = "e246a08f-7f34-4166-97e7-3ed4d015cd1b"; // ใส่ API Key ของ IQAir
  var url = "https://api.airvisual.com/v2/nearest_city?lat=" + latitude + "&lon=" + longitude + "&key=" + apiKey;
  
  try {
    var response = UrlFetchApp.fetch(url);
    var json = JSON.parse(response.getContentText());
    Logger.log("API Response: " + JSON.stringify(json)); // บันทึกการตอบกลับจาก API

    if (json.status === "success") {
      var data = json.data.current.pollution;
      var location = json.data.city + ", " + json.data.country;
      var timestamp = new Date(); // เวลาปัจจุบัน

      var pm25 = data.aqius; // ใช้ aqius สำหรับ PM2.5
      var pm10 = data.aqicn; // ใช้ aqicn สำหรับ PM10
      
      // คำนวณผลต่างของเวลา (Time Difference)
      var sheet = getSheetByName("PM25Datas");
      var lastRow = sheet.getLastRow();
      var lastTimestamp = lastRow > 1 ? new Date(sheet.getRange(lastRow, 1).getValue()) : null;
      var timeDifferenceInMinutes = lastTimestamp ? (timestamp - lastTimestamp) / (1000 * 60) : 60; // ถ้าไม่มีข้อมูลเก่า ให้ใช้ค่าเริ่มต้น 60 นาที
      
      // คำนวณค่า Dose
      var breathingRate = 1.06; // อัตราการหายใจ
      var dose = pm25 * breathingRate * (timeDifferenceInMinutes / 60); // แปลงเวลาเป็นชั่วโมง
      
      // คำนวณค่า Dose รวม (accumulatedDose)
      var accumulatedDose = dose;
      if (lastRow > 1) {
        var lastAccumulatedDose = sheet.getRange(lastRow, 7).getValue(); // ดึงค่า Dose รวมล่าสุด
        accumulatedDose += lastAccumulatedDose;
      }
      
      // บันทึกข้อมูลลงใน sheet
      sheet.appendRow([timestamp, latitude, longitude, location, pm25, pm10, dose, accumulatedDose]);
       
      Logger.log("บันทึกข้อมูลสำเร็จ: " + location + "   PM2.5=" + pm25 + "  PM10=" + pm10 + "  Dose=" + dose + "  Accumulated Dose=" + accumulatedDose);
    } else {
      Logger.log("ไม่สามารถดึงข้อมูลได้: " + json.data.message);
    }
  } catch (error) {
    Logger.log("Error: " + error.toString());
    Logger.log("Stack Trace: " + error.stack); // บันทึกข้อผิดพลาด
  }
}
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}
function getSheetByName(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Timestamp", "lat", "lng", "Location", "PM2.5", "PM10", "Dose", "Accumulated Dose"]); // หัวตาราง
  }
  return sheet;
}
