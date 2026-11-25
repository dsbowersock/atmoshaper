package com.atmoshaper.app

import android.content.Context
import android.os.SystemClock
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collectLatest
import org.json.JSONObject

internal enum class ClockAccessStatus(val key: String) {
    Verified("verified"), Expired("expired"), Rollback("clock"), Missing("missing"),
    Invalid("invalid"), Unavailable("unavailable"), NoGrant("no-grant"),
}

/** Capabilities from the fixed packaged verifier. Selection and styles never
 * carry a grant, and expiration of a subscription leaves ownership intact. */
internal data class ClockBackgroundAccess private constructor(
    val status: ClockAccessStatus,
    val paidThrough: Long?,
    val clockValidAfter: Long?,
    val ownedIds: Set<String>,
    private val elapsedDeadline: Long? = null,
) {
    fun current(wall: Long, elapsed: Long, highWater: Long, expiredTerm: Long?): ClockBackgroundAccess {
        if (paidThrough == null) return this
        val next = when {
            status == ClockAccessStatus.Expired || paidThrough == expiredTerm || wall >= paidThrough ||
                (elapsedDeadline != null && elapsed >= elapsedDeadline) -> ClockAccessStatus.Expired
            wall < maxOf(highWater - 60_000L, checkNotNull(clockValidAfter)) -> ClockAccessStatus.Rollback
            else -> ClockAccessStatus.Verified
        }
        return if (next == status) this else copy(status = next)
    }

    val hasPremiumBackgrounds: Boolean
        get() = status == ClockAccessStatus.Verified && paidThrough != null &&
            elapsedDeadline != null && SystemClock.elapsedRealtime() < elapsedDeadline &&
            System.currentTimeMillis() in checkNotNull(clockValidAfter) until paidThrough

    fun nextCheckDelay(wall: Long, elapsed: Long): Long =
        if (status == ClockAccessStatus.Verified && paidThrough != null && elapsedDeadline != null) {
            minOf(paidThrough - wall, elapsedDeadline - elapsed, 1000L).coerceAtLeast(1L)
        } else 1000L

    companion object {
        val unavailable = ClockBackgroundAccess(ClockAccessStatus.Unavailable, null, null, emptySet())
        private val backgroundId = Regex("[a-z0-9-]{1,100}")
        private const val maxSafeInteger = 9_007_199_254_740_991L

        fun decode(message: String): ClockBackgroundAccess {
            require(message.length <= 14_000)
            val json = JSONObject(message)
            require(json.keys().asSequence().toSet() == setOf("status", "paidThrough", "clockValidAfter", "ownedIds"))
            fun timestamp(key: String): Long? = json.get(key).let {
                when (it) {
                    JSONObject.NULL -> null
                    is Int, is Long -> (it as Number).toLong().also { value -> require(value in 1..maxSafeInteger) }
                    else -> throw IllegalArgumentException("Invalid access timestamp")
                }
            }
            val status = ClockAccessStatus.entries.first { it.key == json.get("status") }
            val paidThrough = timestamp("paidThrough")
            val clockValidAfter = timestamp("clockValidAfter")
            val ids = json.getJSONArray("ownedIds")
            require(ids.length() <= 128)
            val ownedIds = (0 until ids.length()).map {
                (ids.get(it) as String).also { id -> require(backgroundId.matches(id)) }
            }.toSet()
            require(ownedIds.size == ids.length())
            when (status) {
                ClockAccessStatus.Verified -> require(clockValidAfter != null && (paidThrough != null || ownedIds.isNotEmpty()))
                ClockAccessStatus.Expired, ClockAccessStatus.Rollback -> require(clockValidAfter != null && paidThrough != null)
                ClockAccessStatus.NoGrant -> require(clockValidAfter != null && paidThrough == null && ownedIds.isEmpty())
                else -> require(clockValidAfter == null && paidThrough == null && ownedIds.isEmpty())
            }
            val elapsedDeadline = paidThrough?.let { SystemClock.elapsedRealtime() + (it - System.currentTimeMillis()).coerceAtLeast(0L) }
            return ClockBackgroundAccess(status, paidThrough, clockValidAfter, ownedIds, elapsedDeadline)
        }
    }
}

/** Only the trusted legacy entry signals changes. Each generation cancels an
 * outstanding export before a new result can be applied, including on resume.
 * Native clock observations only tighten signed access. Durable evidence lets
 * those guards survive cold starts without writing to the WebView receipt. */
internal object ClockBackgroundAccessChanges {
    private const val clockEvidence = "clock-background-time"
    private const val lastSeen = "last-seen"
    private const val expired = "expired-term"
    data class Generation(val serial: Long = 0, val removing: Boolean = false)
    val changes = MutableStateFlow(Generation())

    @JvmStatic
    fun receive(context: Context, message: String) {
        val before = changes.value
        when (message) {
            "removing" -> changes.value = Generation(before.serial + 1, true)
            "removed", "replaced" -> {
                evidence(context).edit().remove(lastSeen).remove(expired).apply()
                changes.value = Generation(before.serial + 1, false)
            }
            "remove-failed" -> changes.value = Generation(before.serial + 1, true)
        }
    }

    private fun evidence(context: Context) = context.getSharedPreferences(clockEvidence, Context.MODE_PRIVATE)

    class ClockGuard(context: Context) {
        private val preferences = evidence(context)
        private var persistedSeen = preferences.getLong(lastSeen, 0L)
        private var highWater = persistedSeen
        private var expiredTerm = preferences.getLong(expired, 0L).takeIf { it > 0L }

        fun evaluate(snapshot: ClockBackgroundAccess, wall: Long, elapsed: Long): ClockBackgroundAccess {
            val checked = snapshot.current(wall, elapsed, highWater, expiredTerm)
            if (checked.status == ClockAccessStatus.Verified && checked.paidThrough != null) {
                highWater = maxOf(highWater, wall)
                if (highWater >= persistedSeen + 30_000L) {
                    preferences.edit().putLong(lastSeen, highWater).apply()
                    persistedSeen = highWater
                }
            } else if (checked.status == ClockAccessStatus.Expired && checked.paidThrough != expiredTerm) {
                expiredTerm = checkNotNull(checked.paidThrough)
                preferences.edit().putLong(expired, checkNotNull(expiredTerm)).apply()
            }
            return checked
        }
    }
}

@Composable
internal fun rememberClockBackgroundAccess(activity: HomeActivity): ClockBackgroundAccess {
    var access by remember(activity) { mutableStateOf(ClockBackgroundAccess.unavailable) }
    LaunchedEffect(activity) {
        activity.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            ClockBackgroundAccessChanges.changes.collectLatest { generation ->
                access = ClockBackgroundAccess.unavailable
                if (generation.removing) return@collectLatest
                try {
                    val guard = ClockBackgroundAccessChanges.ClockGuard(activity)
                    var snapshot = readPackagedExport(activity, PackagedExport.BackgroundAccess, ClockBackgroundAccess::decode)
                        ?: ClockBackgroundAccess.unavailable
                    while (true) {
                        val wall = System.currentTimeMillis()
                        val elapsed = SystemClock.elapsedRealtime()
                        snapshot = guard.evaluate(snapshot, wall, elapsed)
                        access = snapshot
                        delay(snapshot.nextCheckDelay(wall, elapsed))
                    }
                } finally {
                    access = ClockBackgroundAccess.unavailable
                }
            }
        }
    }
    return access
}

internal fun ClockBackgroundAccess.denialMessage(): Int = when (status) {
    ClockAccessStatus.Expired -> R.string.clock_background_access_expired
    ClockAccessStatus.Rollback -> R.string.clock_background_access_clock
    ClockAccessStatus.Invalid -> R.string.clock_background_access_invalid
    ClockAccessStatus.NoGrant, ClockAccessStatus.Verified -> R.string.clock_background_access_not_included
    else -> R.string.clock_background_locked
}
