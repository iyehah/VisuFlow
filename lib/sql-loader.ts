let sqlPromise: Promise<any> | null = null

const SQL_JS_CDN_URL = process.env.SQL_JS_CDN_URL || 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
const SQL_JS_WASM_CDN_URL = process.env.SQL_JS_WASM_CDN_URL || 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0';

export function initSqlJs() {
  if (sqlPromise) {
    return sqlPromise
  }

  // Use a CDN-hosted version of SQL.js
  const sqlJsScript = document.createElement("script")
  sqlJsScript.src = SQL_JS_CDN_URL
  document.head.appendChild(sqlJsScript)

  sqlPromise = new Promise((resolve, reject) => {
    sqlJsScript.onload = () => {
      // Initialize SQL.js with the WebAssembly file from CDN
      const initSqlJs = (window as any).initSqlJs

      if (!initSqlJs) {
        reject(new Error("Failed to load SQL.js"))
        return
      }

      initSqlJs({
        locateFile: (file: string) => `${SQL_JS_WASM_CDN_URL}/${file}`,
      })
        .then(resolve)
        .catch(reject)
    }

    sqlJsScript.onerror = () => {
      reject(new Error("Failed to load SQL.js script"))
    }
  })

  return sqlPromise
}