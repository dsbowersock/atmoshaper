package com.atmoshaper.app

import android.content.Context
import org.json.JSONArray

internal data class NativeStation(
    val id: String,
    val title: String,
    val artist: String,
    val description: String,
    val tags: List<String>,
    val creditArtist: String,
    val license: String,
    val sourceUrl: String,
    val notice: String,
    val playable: Boolean,
)

/** Read the public catalog shipped with this APK, with one successful parse per
 * process. Both Compose and the independent playback service use these IDs. */
internal object NativeStationCatalog {
    @Volatile private var catalog: List<NativeStation>? = null

    fun read(context: Context): List<NativeStation> = catalog ?: synchronized(this) {
        catalog ?: readAsset(context).also { catalog = it }
    }

    private fun readAsset(context: Context): List<NativeStation> {
        val entries = context.assets.open("core/native-station-catalog.json")
            .bufferedReader().use { JSONArray(it.readText()) }
        return List(entries.length()) { index ->
            val entry = entries.getJSONObject(index)
            val station = entry.getJSONObject("station")
            val credit = station.getJSONObject("attribution")
            val tags = station.getJSONArray("tags")
            NativeStation(
                id = station.getString("id"),
                title = station.getString("title"),
                artist = station.getString("artist"),
                description = station.getString("description"),
                tags = List(tags.length(), tags::getString),
                creditArtist = credit.getString("artist"),
                license = credit.getString("license"),
                sourceUrl = credit.getString("sourceUrl"),
                notice = credit.getString("notice"),
                playable = entry.getString("playback") == "generative-fm",
            )
        }
    }
}
