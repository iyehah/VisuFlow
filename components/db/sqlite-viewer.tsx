"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, Database, TableIcon, FileText, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import JsonTreeGraph from "@/components/json/json-graph"
import { useLanguage } from "@/components/langs/language-provider"
import { initSqlJs } from "@/lib/sql-loader"

export default function SqliteViewer() {
  const [db, setDb] = useState<any>(null)
  const [dbStructure, setDbStructure] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tableData, setTableData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<"structure" | "data" | "tree">("structure")
  const [sqlQuery, setSqlQuery] = useState<string>("")
  const [queryResult, setQueryResult] = useState<any[] | null>(null)
  const [queryColumns, setQueryColumns] = useState<string[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const { t } = useLanguage()

  // Check if we have a database file in localStorage
  useEffect(() => {
    const loadDatabaseFromStorage = async () => {
      const base64Content = localStorage.getItem("dbFileContent")
      const demoMode = localStorage.getItem("demoMode")

      if (base64Content) {
        setLoading(true)
        try {
          // Convert Base64 string back to ArrayBuffer
          const binaryString = atob(base64Content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Load the database
          await loadDatabase(bytes.buffer)
        } catch (err) {
          console.error("Error loading database from storage:", err)
          setError("Error loading database from storage. Please try uploading again.")
        } finally {
          setLoading(false)
        }
      } else if (demoMode) {
        // Load demo database
        loadExampleDb()
        // Clear demo mode flag
        localStorage.removeItem("demoMode")
      }
    }

    loadDatabaseFromStorage()
  }, [])

  // Add example database
  const loadExampleDb = async () => {
    setLoading(true)
    setError(null)

    try {
      // Generate mock database structure
      const mockDbStructure = generateMockDbStructure()
      setDbStructure(mockDbStructure)

      // Extract table names
      const mockTables = Object.keys(mockDbStructure.tables)
      setTables(mockTables)

      if (mockTables.length > 0) {
        setSelectedTable(mockTables[0])
        // Generate mock data for the first table
        const mockData = generateMockTableData(
          mockTables[0],
          mockDbStructure.tables[mockTables[0] as keyof typeof mockDbStructure.tables].columns
        )
        setTableData(mockData)
        const tableName = mockTables[0] as keyof typeof mockDbStructure.tables
        setColumns(mockDbStructure.tables[tableName].columns.map((col: any) => col.name))
      }
    } catch (err) {
      console.error("Error loading example database:", err)
      setError("Error loading example database.")
      setDbStructure(null)
      setTables([])
      setSelectedTable("")
      setTableData([])
      setColumns([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // Read file as array buffer
      const buffer = await file.arrayBuffer()

      // Store the file in localStorage for persistence
      localStorage.setItem("dbFileName", file.name)
      const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""))
      localStorage.setItem("dbFileContent", base64)

      // Load the database
      await loadDatabase(buffer)
    } catch (err) {
      console.error("Error loading SQLite database:", err)
      setError("Error loading SQLite database. Please try another file.")
      setDb(null)
      setDbStructure(null)
      setTables([])
      setSelectedTable("")
      setTableData([])
      setColumns([])
    } finally {
      setLoading(false)
    }
  }

  const loadDatabase = async (buffer: ArrayBuffer) => {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs()

      // Create database from file
      const database = new SQL.Database(new Uint8Array(buffer))
      setDb(database)

      // Extract database structure
      const structure = extractDatabaseStructure(database)
      setDbStructure(structure)

      // Get table names
      const tableNames = Object.keys(structure.tables)
      setTables(tableNames)


      if (tableNames.length > 0) {
        setSelectedTable(tableNames[0])

        // Get table data for the first table
        const result = database.exec(`SELECT * FROM ${tableNames[0]} LIMIT 100`)
        if (result.length > 0) {
          setColumns(result[0].columns)
          setTableData(
            result[0].values.map((row: any) => {
              const rowData: Record<string, any> = {}
              row.forEach((cell: any, index: number) => {
                rowData[result[0].columns[index]] = cell
              })
              return rowData
            }),
          )
        }
      }
    } catch (err) {
      console.error("Error in loadDatabase:", err)
      throw err
    }
  }

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName)

    if (db) {
      try {
        // Get table data
        const result = db.exec(`SELECT * FROM ${tableName} LIMIT 100`)
        if (result.length > 0) {
          setColumns(result[0].columns)
          setTableData(
            result[0].values.map((row: any) => {
              const rowData: Record<string, any> = {}
              row.forEach((cell: any, index: number) => {
                rowData[result[0].columns[index]] = cell
              })
              return rowData
            }),
          )
        } else {
          setColumns([])
          setTableData([])
        }
      } catch (err) {
        console.error("Error fetching table data:", err)
        setError(`Error fetching data for table ${tableName}`)
      }
    } else if (dbStructure && dbStructure.tables[tableName]) {
      // For mock database
      setColumns(dbStructure.tables[tableName].columns.map((col: any) => col.name))
      setTableData(generateMockTableData(tableName, dbStructure.tables[tableName].columns))
    }
  }

  const executeQuery = () => {
    if (!db || !sqlQuery.trim()) {
      setQueryError("Please enter a valid SQL query")
      return
    }

    setQueryError(null)

    try {
      const result = db.exec(sqlQuery)
      if (result.length > 0) {
        setQueryColumns(result[0].columns)
        setQueryResult(
          result[0].values.map((row: any) => {
            const rowData: Record<string, any> = {}
            row.forEach((cell: any, index: number) => {
              rowData[result[0].columns[index]] = cell
            })
            return rowData
          }),
        )
      } else {
        setQueryColumns([])
        setQueryResult([])
      }
    } catch (err: any) {
      console.error("Error executing query:", err)
      setQueryError(err.message || "Error executing query")
    }
  }

  // Extract database structure from SQLite database
  function extractDatabaseStructure(database: any) {
    // Get all tables
    const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")

    const tables: Record<string, any> = {}

    if (tablesResult.length > 0 && tablesResult[0].values) {
      for (const [tableName] of tablesResult[0].values) {
        // Get table columns
        const columnsResult = database.exec(`PRAGMA table_info(${tableName})`)
        const columns = []

        if (columnsResult.length > 0 && columnsResult[0].values) {
          for (const [cid, name, type, notNull, defaultValue, pk] of columnsResult[0].values) {
            columns.push({
              name,
              type,
              notNull: !!notNull,
              defaultValue,
              primaryKey: !!pk,
            })
          }
        }

        // Get foreign keys
        const foreignKeysResult = database.exec(`PRAGMA foreign_key_list(${tableName})`)
        const foreignKeys = []

        if (foreignKeysResult.length > 0 && foreignKeysResult[0].values) {
          for (const [id, seq, table, from, to, onUpdate, onDelete, match] of foreignKeysResult[0].values) {
            foreignKeys.push({
              table,
              from,
              to,
              onUpdate,
              onDelete,
            })
          }
        }

        // Get indexes
        const indexesResult = database.exec(`PRAGMA index_list(${tableName})`)
        const indexes = []

        if (indexesResult.length > 0 && indexesResult[0].values) {
          for (const [seq, name, unique] of indexesResult[0].values) {
            const indexColumnsResult = database.exec(`PRAGMA index_info(${name})`)
            const indexColumns = []

            if (indexColumnsResult.length > 0 && indexColumnsResult[0].values) {
              for (const [seqno, cid, columnName] of indexColumnsResult[0].values) {
                indexColumns.push(columnName)
              }
            }

            indexes.push({
              name,
              unique: !!unique,
              columns: indexColumns,
            })
          }
        }

        tables[tableName] = {
          name: tableName,
          columns,
          foreignKeys,
          indexes,
        }
      }
    }

    return {
      tables,
    }
  }

  // Generate mock database structure
  function generateMockDbStructure() {
    return {
      tables: {
        users: {
          name: "users",
          columns: [
            { name: "id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: true },
            { name: "username", type: "TEXT", notNull: true, defaultValue: null, primaryKey: false },
            { name: "email", type: "TEXT", notNull: true, defaultValue: null, primaryKey: false },
            {
              name: "created_at",
              type: "TIMESTAMP",
              notNull: false,
              defaultValue: "CURRENT_TIMESTAMP",
              primaryKey: false,
            },
          ],
          foreignKeys: [],
          indexes: [{ name: "idx_users_email", unique: true, columns: ["email"] }],
        },
        posts: {
          name: "posts",
          columns: [
            { name: "id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: true },
            { name: "user_id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: false },
            { name: "title", type: "TEXT", notNull: true, defaultValue: null, primaryKey: false },
            { name: "content", type: "TEXT", notNull: false, defaultValue: null, primaryKey: false },
            { name: "published", type: "BOOLEAN", notNull: false, defaultValue: "0", primaryKey: false },
            {
              name: "created_at",
              type: "TIMESTAMP",
              notNull: false,
              defaultValue: "CURRENT_TIMESTAMP",
              primaryKey: false,
            },
          ],
          foreignKeys: [{ table: "users", from: "user_id", to: "id", onUpdate: "CASCADE", onDelete: "CASCADE" }],
          indexes: [{ name: "idx_posts_user_id", unique: false, columns: ["user_id"] }],
        },
        comments: {
          name: "comments",
          columns: [
            { name: "id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: true },
            { name: "post_id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: false },
            { name: "user_id", type: "INTEGER", notNull: true, defaultValue: null, primaryKey: false },
            { name: "content", type: "TEXT", notNull: true, defaultValue: null, primaryKey: false },
            {
              name: "created_at",
              type: "TIMESTAMP",
              notNull: false,
              defaultValue: "CURRENT_TIMESTAMP",
              primaryKey: false,
            },
          ],
          foreignKeys: [
            { table: "posts", from: "post_id", to: "id", onUpdate: "CASCADE", onDelete: "CASCADE" },
            { table: "users", from: "user_id", to: "id", onUpdate: "CASCADE", onDelete: "CASCADE" },
          ],
          indexes: [
            { name: "idx_comments_post_id", unique: false, columns: ["post_id"] },
            { name: "idx_comments_user_id", unique: false, columns: ["user_id"] },
          ],
        },
      },
    }
  }

  // Generate mock table data
  function generateMockTableData(tableName: string, columns: any[]) {
    const mockData = []
    const numRows = Math.floor(Math.random() * 10) + 5 // 5-15 rows

    for (let i = 1; i <= numRows; i++) {
      const row: Record<string, any> = {}

      columns.forEach((col: any) => {
        const colName = col.name || col
        const colType = col.type || "TEXT"

        if (colName === "id") {
          row[colName] = i
        } else if (colType.includes("INT")) {
          row[colName] = Math.floor(Math.random() * 1000)
        } else if (colType.includes("TEXT")) {
          if (colName === "email") {
            row[colName] = `user${i}@example.com`
          } else if (colName === "username") {
            row[colName] = `user${i}`
          } else if (colName === "title") {
            row[colName] = `Sample ${tableName} title ${i}`
          } else if (colName === "content") {
            row[colName] = `This is sample content for ${tableName} record ${i}`
          } else {
            row[colName] = `${colName}_${i}`
          }
        } else if (colType.includes("BOOL")) {
          row[colName] = Math.random() > 0.5 ? 1 : 0
        } else if (colType.includes("TIME") || colType.includes("DATE")) {
          row[colName] = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        } else {
          row[colName] = `${colName}_${i}`
        }
      })

      mockData.push(row)
    }

    return mockData
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <input
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Upload SQLite database file"
          />
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t("uploadSqlite")}
          </Button>
        </div>
        <Button variant="outline" onClick={loadExampleDb} disabled={loading}>
          {t("loadExampleDb")}
        </Button>
        {loading && <span className="text-sm text-muted-foreground">Loading database...</span>}

        {tables.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium">{t("selectTable")}:</span>
            <Select value={selectedTable} onValueChange={handleTableChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {dbStructure ? (
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList>
            <TabsTrigger value="structure">
              <Database className="h-4 w-4 mr-2" />
              {t("structure")}
            </TabsTrigger>
            <TabsTrigger value="data">
              <TableIcon className="h-4 w-4 mr-2" />
              {t("data")}
            </TabsTrigger>
            <TabsTrigger value="tree">
              <FileText className="h-4 w-4 mr-2" />
              {t("treeView")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="border rounded-md p-4 min-h-[500px]">
            {selectedTable && dbStructure.tables[selectedTable] && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">{t("columns")}</h3>
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("name")}</TableHead>
                          <TableHead>{t("type")}</TableHead>
                          <TableHead>{t("notNull")}</TableHead>
                          <TableHead>{t("defaultValue")}</TableHead>
                          <TableHead>{t("primaryKey")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbStructure.tables[selectedTable].columns.map((column: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell>{column.type}</TableCell>
                            <TableCell>{column.notNull ? "YES" : "NO"}</TableCell>
                            <TableCell>{column.defaultValue || "-"}</TableCell>
                            <TableCell>{column.primaryKey ? "YES" : "NO"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {dbStructure.tables[selectedTable].foreignKeys.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t("foreignKeys")}</h3>
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("column")}</TableHead>
                            <TableHead>{t("referencesTable")}</TableHead>
                            <TableHead>{t("referencesColumn")}</TableHead>
                            <TableHead>{t("onUpdate")}</TableHead>
                            <TableHead>{t("onDelete")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dbStructure.tables[selectedTable].foreignKeys.map((fk: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{fk.from}</TableCell>
                              <TableCell>{fk.table}</TableCell>
                              <TableCell>{fk.to}</TableCell>
                              <TableCell>{fk.onUpdate || "NO ACTION"}</TableCell>
                              <TableCell>{fk.onDelete || "NO ACTION"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {dbStructure.tables[selectedTable].indexes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t("indexes")}</h3>
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("name")}</TableHead>
                            <TableHead>{t("unique")}</TableHead>
                            <TableHead>{t("columns")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dbStructure.tables[selectedTable].indexes.map((index: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{index.name}</TableCell>
                              <TableCell>{index.unique ? "YES" : "NO"}</TableCell>
                              <TableCell>{index.columns.join(", ")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">{t("sqlQuery")}</h3>
                <div className="flex gap-2">
                  <Input
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="SELECT * FROM table_name"
                    className="font-mono"
                  />
                  <Button onClick={executeQuery}>{t("execute")}</Button>
                  <Button variant="outline" onClick={() => setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 100`)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("reset")}
                  </Button>
                </div>
                {queryError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{queryError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="border rounded-md overflow-auto">
                {queryResult ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryColumns.map((column, index) => (
                          <TableHead key={index}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResult.length > 0 ? (
                        queryResult.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {queryColumns.map((column, colIndex) => (
                              <TableCell key={colIndex}>{formatCellValue(row[column])}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={queryColumns.length} className="text-center py-4">
                            {t("noResults")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((column, index) => (
                          <TableHead key={index}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.length > 0 ? (
                        tableData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <TableCell key={colIndex}>{formatCellValue(row[column])}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="text-center py-4">
                            {t("noData")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="tree"
            className="border rounded-md p-4 min-h-[500px] overflow-auto"
          >
            <JsonTreeGraph data={dbStructure} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="border rounded-md p-4 min-h-[500px] overflow-auto flex items-center justify-center">
          <div className="text-center max-w-md">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t("noDatabaseLoaded")}</h3>
            <p className="text-muted-foreground mb-4">{t("uploadDatabasePrompt")}</p>
            
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format cell values for display
function formatCellValue(value: any): string {
  if (value === null) return "NULL"
  if (value === undefined) return ""

  // Check if it's a date string
  if (
    typeof value === "string" &&
    (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/))
  ) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString()
      }
    } catch (e) {
      // Not a valid date, continue with default formatting
    }
  }

  return String(value)
}
