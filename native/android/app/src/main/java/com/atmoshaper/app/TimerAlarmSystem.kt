package com.atmoshaper.app

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build

internal data class TimerAlertStatus(val notifications: Boolean, val precise: Boolean)

/** Owns only OS alarm and notification identities. Timer state lives in the
 * verified local file, so delivery never depends on an activity or service. */
internal class TimerAlarmSystem(private val context: Context) {
    private val alarms = checkNotNull(context.getSystemService(AlarmManager::class.java))
    private val notifications = checkNotNull(context.getSystemService(NotificationManager::class.java))

    fun status(setup: TimerSetup): TimerAlertStatus =
        TimerAlertStatus(canDeliver(setup), canSchedulePrecisely())

    fun canDeliver(setup: TimerSetup): Boolean =
        notifications.areNotificationsEnabled() &&
            notifications.getNotificationChannel(channelFor(setup))?.importance != NotificationManager.IMPORTANCE_NONE

    private fun canSchedulePrecisely(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()

    /** Replace the pending occurrence rather than queueing multiple alarms.
     * A permission change racing setExact may leave only foreground delivery
     * until the next reconciliation. */
    fun sync(snapshot: TimerSnapshot, previous: TimerSnapshot? = null) {
        val existing = PendingIntent.getBroadcast(context, alarmRequest, receiver(fireAction), findImmutable)
        if (existing != null) {
            alarms.cancel(existing)
            existing.cancel()
        }
        val active = snapshot.phase == TimerPhase.Running || snapshot.phase == TimerPhase.Paused
        if (!active || previous?.sessionId != snapshot.sessionId || previous?.deadlineMs != snapshot.deadlineMs ||
            previous?.intervalMs != snapshot.intervalMs || snapshot.phase == TimerPhase.Paused) {
            notifications.cancel(intervalNotice)
        }
        if (snapshot.phase != TimerPhase.Complete) notifications.cancel(completeNotice)
        if (!active) {
            notifications.cancel(progressNotice)
            return
        }
        val session = checkNotNull(snapshot.sessionId)
        val at = snapshot.nextAlarmAt
        val precise = if (at != null) {
            val intent = receiver(fireAction)
                .putExtra("session", session)
                .putExtra("at", at)
                .putExtra("deadline", checkNotNull(snapshot.deadlineMs))
            val delivery = PendingIntent.getBroadcast(context, alarmRequest, intent, PendingIntent.FLAG_IMMUTABLE)
            schedule(at, delivery)
        } else false
        showProgress(snapshot, session, precise)
    }

    @SuppressLint("ScheduleExactAlarm")
    private fun schedule(at: Long, delivery: PendingIntent): Boolean {
        if (canSchedulePrecisely()) {
            try {
                alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, delivery)
                return true
            } catch (_: SecurityException) {
                // The permission can be revoked between the check and call.
            }
        }
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, delivery)
        return false
    }

    private fun showProgress(snapshot: TimerSnapshot, session: String, precise: Boolean) {
        val channel = NotificationChannel(progressChannel, context.getString(R.string.timer_progress_channel),
            NotificationManager.IMPORTANCE_LOW)
        channel.setSound(null, null)
        notifications.createNotificationChannel(channel)
        val end = receiver(endAction).setData(Uri.fromParts("atmoshaper-timer", session, null))
            .putExtra("session", session)
        val endAction = Notification.Action.Builder(null, context.getString(R.string.timer_end),
            PendingIntent.getBroadcast(context, endRequest, end, PendingIntent.FLAG_IMMUTABLE)).build()
        val running = snapshot.phase == TimerPhase.Running
        val builder = notification(progressChannel,
            if (running) R.string.timer_running else R.string.timer_paused)
            .setOngoing(true).setOnlyAlertOnce(true).addAction(endAction)
        if (running) {
            builder.setWhen(checkNotNull(snapshot.deadlineMs)).setShowWhen(true)
                .setUsesChronometer(true).setChronometerCountDown(true)
            if (!precise) builder.setContentText(context.getString(R.string.timer_alerts_delayed))
        }
        publish(progressNotice, builder.build())
    }

    fun alert(transition: TimerAdvance) {
        val signal = transition.cue ?: return
        val setup = transition.snapshot.setup
        val channelId = channelFor(setup)
        val channel = NotificationChannel(channelId, context.getString(when (channelId) {
            soundChannel -> R.string.timer_sound_channel
            vibrationChannel -> R.string.timer_vibration_channel
            soundAndVibrationChannel -> R.string.timer_sound_vibration_channel
            else -> R.string.timer_silent_channel
        }), NotificationManager.IMPORTANCE_DEFAULT)
        val sound = setup.cue.sound && setup.volume > 0
        val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build()
        channel.setSound(if (sound) RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION) else null, attributes)
        channel.enableVibration(setup.cue.vibration)
        notifications.createNotificationChannel(channel)
        val completed = signal == TimerSignal.Completion
        publish(if (completed) completeNotice else intervalNotice,
            notification(channelId, if (completed) R.string.timer_complete else R.string.timer_interval_alert)
                .setAutoCancel(true).build())
    }

    @SuppressLint("MissingPermission") // areNotificationsEnabled covers runtime permission and app settings.
    private fun publish(id: Int, notification: Notification) {
        if (notifications.areNotificationsEnabled()) notifications.notify(id, notification)
    }

    private fun notification(channel: String, title: Int) =
        Notification.Builder(context, channel)
            .setSmallIcon(R.drawable.home_clock)
            .setContentTitle(context.getString(title))
            .setCategory(Notification.CATEGORY_REMINDER)
            .setContentIntent(PendingIntent.getActivity(context, openRequest,
                Intent(context, NativeTimerActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_IMMUTABLE))

    private fun receiver(action: String) = Intent(context, NativeTimerAlarmReceiver::class.java).setAction(action)

    private fun channelFor(setup: TimerSetup): String {
        val sound = setup.cue.sound && setup.volume > 0
        return when {
            sound && setup.cue.vibration -> soundAndVibrationChannel
            sound -> soundChannel
            setup.cue.vibration -> vibrationChannel
            else -> silentChannel
        }
    }

    companion object {
        const val fireAction = "com.atmoshaper.app.timer.ALARM"
        const val endAction = "com.atmoshaper.app.timer.END"
        private const val findImmutable = PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        private const val alarmRequest = 601
        private const val endRequest = 602
        private const val openRequest = 603
        private const val progressNotice = 601
        private const val intervalNotice = 602
        private const val completeNotice = 603
        private const val progressChannel = "native-timer-progress"
        private const val soundChannel = "native-timer-sound"
        private const val vibrationChannel = "native-timer-vibration"
        private const val soundAndVibrationChannel = "native-timer-sound-vibration"
        private const val silentChannel = "native-timer-silent"
    }
}
