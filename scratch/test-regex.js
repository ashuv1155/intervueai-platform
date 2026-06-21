const fs = require('fs');
const path = require('path');

const serviceAccountPath = '/Users/ashutoshbalasahebtemgire/Downloads/intervueai-platform-9c1d2-firebase-adminsdk-fbsvc-074abaeb50.json';
const rawJson = fs.readFileSync(serviceAccountPath, 'utf8');

// Simulate Vercel Base64 flow
const base64Str = Buffer.from(rawJson).toString('base64');
const decoded = Buffer.from(base64Str, 'base64').toString('utf-8');

const cleanJsonString = (str) => {
  return str.replace(/"private_key":\s*"([\s\S]*?)"/, (match, p1) => {
    const escaped = p1.replace(/\r/g, "").replace(/\n/g, "\\n");
    return `"private_key": "${escaped}"`;
  });
};

console.log("Original JSON length:", rawJson.length);
console.log("Decoded Base64 length:", decoded.length);

try {
  const parsedDirect = JSON.parse(decoded);
  console.log("SUCCESS: JSON.parse directly succeeded!");
} catch (e) {
  console.log("FAILED: JSON.parse directly failed:", e.message);
}

try {
  const cleaned = cleanJsonString(decoded);
  const parsedCleaned = JSON.parse(cleaned);
  console.log("SUCCESS: JSON.parse on cleaned string succeeded!");
  console.log("Private Key starts with:", parsedCleaned.private_key.substring(0, 40));
  console.log("Private Key ends with:", parsedCleaned.private_key.substring(parsedCleaned.private_key.length - 40));
  
  // Test replacing escaped newlines
  const finalKey = parsedCleaned.private_key.replace(/\\n/g, "\n");
  console.log("Final Key contains actual newlines:", finalKey.includes("\n"));
} catch (e) {
  console.log("FAILED: JSON.parse on cleaned string failed:", e.message);
}
