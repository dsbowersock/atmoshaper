package com.atmoshaper.app

import androidx.core.util.AtomicFile
import java.io.File
import java.io.FileNotFoundException

/** Stages app-private snapshots and confirms the decoded readback. The owner
 * serializes reads and writes, including its read-modify-write operations. */
internal class VerifiedAtomicFile<T : Any>(
    path: File,
    private val encode: (T) -> String,
    private val decode: (String) -> T,
) {
    private val file = AtomicFile(path)

    fun read(): T? = try {
        decode(file.readFully().toString(Charsets.UTF_8))
    } catch (error: FileNotFoundException) {
        if (file.baseFile.exists()) throw error
        null
    }

    fun write(value: T): T {
        val bytes = encode(value).toByteArray()
        val output = file.startWrite()
        try {
            output.write(bytes)
            output.fd.sync()
            file.finishWrite(output)
        } catch (error: Exception) {
            file.failWrite(output)
            throw error
        }
        check(read() == value) { "Atomic snapshot readback did not match" }
        return value
    }
}
