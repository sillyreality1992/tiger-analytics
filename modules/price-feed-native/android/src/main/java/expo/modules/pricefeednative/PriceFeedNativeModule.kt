package expo.modules.pricefeednative

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.net.Uri
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedReader
import java.io.InputStreamReader

class PriceFeedNativeModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private val dbHelper: PriceDbHelper by lazy {
    PriceDbHelper(context)
  }

  override fun definition() = ModuleDefinition {
    Name("PriceFeedNative")

    Events("onImportProgress")

    AsyncFunction("setupDatabase") {
      dbHelper.writableDatabase
      true
    }

    AsyncFunction("importCsv") { fileUri: String ->
      return@AsyncFunction importCsv(fileUri)
    }

    AsyncFunction("searchRecords") { filters: Map<String, Any?> ->
      return@AsyncFunction searchRecords(filters)
    }

    AsyncFunction("updateRecord") { id: Int, fields: Map<String, Any?> ->
      return@AsyncFunction updateRecord(id.toLong(), fields)
    }
  }

  private fun importCsv(fileUri: String): Map<String, Int> {
    val uri = Uri.parse(fileUri)
    val inputStream = context.contentResolver.openInputStream(uri)
      ?: throw IllegalArgumentException("Cannot open CSV file")

    val db = dbHelper.writableDatabase

    var imported = 0
    var failed = 0

    inputStream.use { stream ->
      BufferedReader(InputStreamReader(stream)).use { reader ->
        reader.readLine()

        db.beginTransaction()

        try {
          db.delete("pricing_records", null, null)

          while (true) {
            val line = reader.readLine() ?: break
            val columns = parseCsvLine(line)

            if (columns.size < 5) {
              failed++
              continue
            }

            val storeId = columns[0].trim()
            val sku = columns[1].trim()
            val productName = columns[2].trim()
            val price = columns[3].trim().toDoubleOrNull()
            val date = columns[4].trim()

            if (
              storeId.isEmpty() ||
              sku.isEmpty() ||
              productName.isEmpty() ||
              price == null ||
              date.isEmpty()
            ) {
              failed++
              continue
            }

            val values = ContentValues().apply {
              put("store_id", storeId)
              put("sku", sku)
              put("product_name", productName)
              put("price", price)
              put("price_date", date)
              put("updated_at", System.currentTimeMillis())
            }

            db.insertWithOnConflict(
              "pricing_records",
              null,
              values,
              SQLiteDatabase.CONFLICT_REPLACE
            )

            imported++

            if (imported % 5000 == 0) {
              db.setTransactionSuccessful()
              db.endTransaction()

              sendEvent(
                "onImportProgress",
                bundleOf(
                  "imported" to imported,
                  "failed" to failed
                )
              )

              db.beginTransaction()
            }
          }

          db.setTransactionSuccessful()
        } finally {
          if (db.inTransaction()) {
            db.endTransaction()
          }
        }
      }
    }

    sendEvent(
      "onImportProgress",
      bundleOf(
        "imported" to imported,
        "failed" to failed
      )
    )

    return mapOf(
      "imported" to imported,
      "failed" to failed
    )
  }

  private fun searchRecords(filters: Map<String, Any?>): List<Map<String, Any?>> {
    val db = dbHelper.readableDatabase

    val where = mutableListOf<String>()
    val args = mutableListOf<String>()

    fun addTextFilter(key: String, column: String) {
      val value = filters[key]?.toString()?.trim()
      if (!value.isNullOrEmpty()) {
        where.add("$column = ?")
        args.add(value)
      }
    }

    fun getDoubleFilter(key: String): Double? {
      val value = filters[key] ?: return null

      return when (value) {
        is Number -> value.toDouble()
        is String -> value.trim().toDoubleOrNull()
        else -> null
      }
    }

    addTextFilter("storeId", "store_id")
    addTextFilter("sku", "sku")

    val productName = filters["productName"]?.toString()?.trim()
    if (!productName.isNullOrEmpty()) {
      where.add("product_name LIKE ?")
      args.add("%$productName%")
    }

    val priceMin = getDoubleFilter("priceMin")
    if (priceMin != null) {
      where.add("price >= ?")
      args.add(priceMin.toString())
    }

    val priceMax = getDoubleFilter("priceMax")
    if (priceMax != null) {
      where.add("price <= ?")
      args.add(priceMax.toString())
    }

    val dateFrom = filters["dateFrom"]?.toString()?.trim()
    if (!dateFrom.isNullOrEmpty()) {
      where.add("price_date >= ?")
      args.add(dateFrom)
    }

    val dateTo = filters["dateTo"]?.toString()?.trim()
    if (!dateTo.isNullOrEmpty()) {
      where.add("price_date <= ?")
      args.add(dateTo)
    }

    val limit = ((filters["limit"] as? Number)?.toInt() ?: 50)
      .coerceIn(1, 100)

    val offset = ((filters["offset"] as? Number)?.toInt() ?: 0)
      .coerceAtLeast(0)

    val whereSql = if (where.isEmpty()) {
      ""
    } else {
      "WHERE ${where.joinToString(" AND ")}"
    }

    val sql = """
      SELECT
        id,
        store_id,
        sku,
        product_name,
        price,
        price_date
      FROM pricing_records
      $whereSql
      ORDER BY price_date DESC
      LIMIT ?
      OFFSET ?
    """.trimIndent()

    args.add(limit.toString())
    args.add(offset.toString())

    val records = mutableListOf<Map<String, Any?>>()

    db.rawQuery(sql, args.toTypedArray()).use { cursor ->
      while (cursor.moveToNext()) {
        records.add(
          mapOf(
            "id" to cursor.getLong(cursor.getColumnIndexOrThrow("id")),
            "storeId" to cursor.getString(cursor.getColumnIndexOrThrow("store_id")),
            "sku" to cursor.getString(cursor.getColumnIndexOrThrow("sku")),
            "productName" to cursor.getString(cursor.getColumnIndexOrThrow("product_name")),
            "price" to cursor.getDouble(cursor.getColumnIndexOrThrow("price")),
            "date" to cursor.getString(cursor.getColumnIndexOrThrow("price_date"))
          )
        )
      }
    }

    return records
  }

  private fun updateRecord(
    id: Long,
    fields: Map<String, Any?>
  ): Map<String, Boolean> {
    val db = dbHelper.writableDatabase
    val values = ContentValues()

    fields["storeId"]?.toString()?.trim()?.let {
      if (it.isNotEmpty()) values.put("store_id", it)
    }

    fields["sku"]?.toString()?.trim()?.let {
      if (it.isNotEmpty()) values.put("sku", it)
    }

    fields["productName"]?.toString()?.trim()?.let {
      if (it.isNotEmpty()) values.put("product_name", it)
    }

    val priceValue = fields["price"]
    when (priceValue) {
      is Number -> values.put("price", priceValue.toDouble())
      is String -> priceValue.trim().toDoubleOrNull()?.let {
        values.put("price", it)
      }
    }

    fields["date"]?.toString()?.trim()?.let {
      if (it.isNotEmpty()) values.put("price_date", it)
    }

    if (values.size() == 0) {
      return mapOf("updated" to false)
    }

    values.put("updated_at", System.currentTimeMillis())

    return try {
      val rows = db.update(
        "pricing_records",
        values,
        "id = ?",
        arrayOf(id.toString())
      )

      mapOf("updated" to (rows > 0))
    } catch (error: SQLiteConstraintException) {
      mapOf("updated" to false)
    }
  }

  private fun parseCsvLine(line: String): List<String> {
    val result = mutableListOf<String>()
    val current = StringBuilder()

    var insideQuotes = false
    var i = 0

    while (i < line.length) {
      val char = line[i]

      when {
        char == '"' -> {
          if (
            insideQuotes &&
            i + 1 < line.length &&
            line[i + 1] == '"'
          ) {
            current.append('"')
            i++
          } else {
            insideQuotes = !insideQuotes
          }
        }

        char == ',' && !insideQuotes -> {
          result.add(current.toString())
          current.clear()
        }

        else -> current.append(char)
      }

      i++
    }

    result.add(current.toString())

    return result
  }
}

class PriceDbHelper(context: Context) :
  SQLiteOpenHelper(context, "pricing_feeds.db", null, 2) {

  init {
    setWriteAheadLoggingEnabled(true)
  }

  override fun onCreate(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE TABLE IF NOT EXISTS pricing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        price_date TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(store_id, sku, price_date)
      )
      """.trimIndent()
    )

    createIndexes(db)
  }

  override fun onUpgrade(
    db: SQLiteDatabase,
    oldVersion: Int,
    newVersion: Int
  ) {
    createIndexes(db)
  }

  private fun createIndexes(db: SQLiteDatabase) {
    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_store_sku_date
      ON pricing_records(store_id, sku, price_date)
      """.trimIndent()
    )

    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_store
      ON pricing_records(store_id)
      """.trimIndent()
    )

    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_sku
      ON pricing_records(sku)
      """.trimIndent()
    )

    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_date
      ON pricing_records(price_date)
      """.trimIndent()
    )

    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_price
      ON pricing_records(price)
      """.trimIndent()
    )

    db.execSQL(
      """
      CREATE INDEX IF NOT EXISTS idx_pricing_product_name
      ON pricing_records(product_name)
      """.trimIndent()
    )
  }
}
