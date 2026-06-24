const fetch = require('node-fetch');

async function testGas() {
  const url = "https://script.google.com/macros/s/AKfycbx-G5OrogC9UNliA0abBF6Wa3MNSl9idPbgPjk7vEK-VljHmNQ7Asz2m3I8VAo4_mAg/exec";
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_all_data", payload: {} })
    });
    
    // Google Apps Script usually redirects POST requests, node-fetch follows it by default
    const text = await res.text();
    console.log("POST get_all_data status:", res.status);
    console.log("Response starts with:", text.substring(0, 300));
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testGas();
