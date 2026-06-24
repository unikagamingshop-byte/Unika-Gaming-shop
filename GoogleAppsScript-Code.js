/**
 * UNIKA GAMING SHOP - GOOGLE APPS SCRIPT CODE
 * 
 * 1. Open your Google Sheet.
 * 2. Click on Extensions > Apps Script.
 * 3. Delete everything there and paste all this code.
 * 4. Click Save.
 * 5. Click Deploy > New Deployment.
 * 6. "Execute as": "Me"
 * 7. "Who has access": "Anyone"
 * 8. Click Deploy, authorize permissions, and COPY your new Web App URL to Netlify environment variables as VITE_GOOGLE_APPS_SCRIPT_URL.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHOP_NAME = "Unika Gaming Shop";

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    });
}

function doGet(e) {
  return handleRequest(e, true);
}

function doPost(e) {
  return handleRequest(e, false);
}

function handleRequest(e, isGet) {
  try {
    let request;
    if (isGet) {
      if (e.parameter.action === 'get_all_data') {
        request = { action: 'get_all_data' };
      } else if (e.parameter.data) {
        request = JSON.parse(decodeURIComponent(e.parameter.data));
      } else {
        return jsonResponse({ success: true, message: "Unika Server is Running. Use POST to transact." });
      }
    } else {
      if (!e || !e.postData || !e.postData.contents) {
        return jsonResponse({ success: false, error: "Empty request" });
      }
      request = JSON.parse(e.postData.contents);
    }

    const { action, payload } = request;
    let result;
    
    switch (action) {
      case 'get_all_data': result = {
        success: true,
        games: getSheetData('Games'),
        orders: getSheetData('Orders'),
        users: getSheetData('Users'),
        chats: getSheetData('Chats'),
        settings: getSettings(),
        admins: getSheetData('Admins'),
        topups: getSheetData('Topups'),
        adjustments: getSheetData('Adjustments')
      }; break;
      case 'update_order': result = updateRowById('Orders', 'id', payload.id, payload); break;
      case 'new_order': result = appendRow('Orders', payload); break;
      case 'new_user': result = appendRow('Users', payload); break;
      case 'update_user': result = updateRowById('Users', 'email', payload.email, payload); break;
      case 'update_game': result = upsertRow('Games', 'id', payload.id, payload); break;
      case 'delete_game': result = deleteRowById('Games', 'id', payload.id); break;
      case 'new_chat_message': result = appendRow('Chats', payload); break;
      case 'update_settings': result = saveSettings(payload); break;
      case 'new_topup': result = appendRow('Topups', payload); break;
      case 'update_topup': result = updateRowById('Topups', 'id', payload.id, payload); break;
      case 'save_admin': result = upsertRow('Admins', 'id', payload.id, payload); break;
      case 'delete_admin': result = deleteRowById('Admins', 'id', payload.id); break;
      case 'new_adjustment': result = appendRow('Adjustments', payload); break;
      default: result = { success: false, error: "Invalid Action" }; break;
    }

    return jsonResponse(result);
  } catch (err) { 
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function getSheetData(name) {
  const sheet = getOrCreateSheet(name);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      try { 
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          val = JSON.parse(val); 
        }
      } catch(e) {}
      obj[h] = val;
    });
    return obj;
  });
}

function updateRowById(sheetName, idKey, idValue, dataObj) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(idKey);
  if (colIdx === -1) return { success: false, error: "ID Key " + idKey + " not found" };
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIdx].toString().toLowerCase() == idValue.toString().toLowerCase()) {
      const newRow = headers.map(h => {
        let val = dataObj[h];
        if (val === undefined) return data[i][headers.indexOf(h)];
        return (typeof val === 'object') ? JSON.stringify(val) : val;
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return { success: true };
    }
  }
  return { success: false, error: "Row with ID " + idValue + " not found" };
}

function upsertRow(sheetName, idKey, idValue, dataObj) {
  const res = updateRowById(sheetName, idKey, idValue, dataObj);
  if (!res.success) return appendRow(sheetName, dataObj);
  return res;
}

function appendRow(sheetName, dataObj) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => {
    let val = dataObj[h];
    return (typeof val === 'object') ? JSON.stringify(val) : (val !== undefined ? val : "");
  });
  sheet.appendRow(row);
  return { success: true };
}

function updateHeadersIfMissing(sheet, schemaHeaders) {
  if (!schemaHeaders || schemaHeaders.length === 0) return;
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
    return;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missingHeaders = schemaHeaders.filter(h => !currentHeaders.includes(h));
  if (missingHeaders.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
  }
}

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  const schema = {
    'Games': ['id', 'name', 'category', 'image', 'badge', 'packages', 'createdAt', 'isSlider', 'isFeatured'],
    'Orders': ['id', 'gameId', 'gameName', 'packageName', 'price', 'status', 'date', 'userId', 'customerName', 'customerEmail', 'customerPhone', 'paymentMethod', 'trxId'],
    'Users': ['id', 'name', 'email', 'phone', 'joinDate', 'avatar', 'password', 'totalSpent', 'orderCount', 'walletBalance'],
    'Chats': ['id', 'userId', 'userName', 'role', 'text', 'timestamp'],
    'Admins': ['id', 'username', 'password', 'role'],
    'Settings': ['data'],
    'Topups': ['id', 'userId', 'userEmail', 'amount', 'platform', 'transactionId', 'status', 'date'],
    'Adjustments': ['id', 'adminName', 'adminEmail', 'userEmail', 'amount', 'type', 'reason', 'date']
  };

  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (schema[name]) sheet.getRange(1, 1, 1, schema[name].length).setValues([schema[name]]);
  } else {
    // Automatically append newly added schema columns (like isSlider, isFeatured)
    if (schema[name]) updateHeadersIfMissing(sheet, schema[name]);
  }
  return sheet;
}

function getSettings() {
  const sheet = getOrCreateSheet('Settings');
  const data = sheet.getRange(2, 1).getValue();
  if (!data) return { sliderGameIds: [] };
  try { 
    return JSON.parse(data); 
  } catch(e) { 
    return { sliderGameIds: [] }; // gracefully fallback if the cell is corrupted!
  }
}

function saveSettings(settings) {
  const sheet = getOrCreateSheet('Settings');
  sheet.getRange(2, 1).setValue(JSON.stringify(settings));
  return { success: true };
}

function jsonResponse(obj) { 
  // Standard JSON response (CORS usually handled by standard redirect, but options preflight setup above)
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
