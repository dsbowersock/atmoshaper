package com.atmoshaper.app

import androidx.core.util.AtomicFile
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.nio.file.Files

@RunWith(AndroidJUnit4::class)
class ClockAppearanceFileTest {
    @Test
    fun interruptedImportCanRetryAndAnExistingCopyWins() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = Files.createTempDirectory(context.cacheDir.toPath(), "clock-transfer-test").toFile()
        val path = File(directory, "appearance.json")
        val atomic = AtomicFile(path)
        val store = ClockAppearanceFile(path)
        val earlier = ClockAppearance(true, true, ClockTypeface.Serif, "#FBE201", false, true, "#FA8202",
            false, ClockBackground.SolidColor, "#908070", "#203040", false)
        val candidate = earlier.copy(color = "#FFFFFF")
        try {
            // The process can stop after writing its staged bytes and before their rename.
            atomic.startWrite().use { it.write("{".toByteArray()) }
            assertEquals(earlier, store.importIfAbsent(earlier))
            atomic.startWrite().use { it.write(candidate.encode().toByteArray()) }
            assertEquals(earlier, store.importIfAbsent(candidate))
            assertEquals(earlier, ClockAppearanceFile(path).read())

            val malformed = earlier.encode().replace("\"gradientColors\":[]", "\"gradientColors\":\"bad\"")
            path.writeText(malformed)
            assertThrows(Exception::class.java) { store.importIfAbsent(candidate) }
            assertEquals(malformed, path.readText())

            path.writeText("{")
            assertThrows(Exception::class.java) { store.importIfAbsent(candidate) }
            assertEquals("{", path.readText())
        } finally {
            atomic.delete()
            directory.delete()
        }
    }
}
