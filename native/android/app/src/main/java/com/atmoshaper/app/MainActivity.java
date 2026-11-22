package com.atmoshaper.app;

import android.content.Intent;
import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Opens the shared web platform in its browser-backed Android surface. No
 * cookie extraction, generic JavaScript bridge or payment authority is exposed.
 */
public final class MainActivity extends LauncherActivity {
    /**
     * Ignore all inbound URI/extras until verified app links and the separately
     * authorized one-use financial handoff are implemented. This also prevents
     * forwarding a rejected URL as the browser's original-launch metadata.
     */
    @Override
    protected Uri getUrlForIntent(Intent intent) {
        return null;
    }
}
