package com.atmoshaper.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.view.WindowManager;
import android.view.View;
import android.webkit.WebChromeClient;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.CookieManager;
import android.widget.FrameLayout;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.QualityEnforcer;
import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Collections;
import org.json.JSONObject;

/** The website runs in a browser-owned trusted app window. Packaged shared
 * tools remain on the isolated local origin, with no account-cookie bridge. */
public final class MainActivity extends ComponentActivity {
    private static final String ENTRY = "https://appassets.androidplatform.net/assets/core/index.html";
    private WebView webView;
    private String pendingReceipt;
    private String pendingRoute;
    private TwaLauncher websiteLauncher;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;
    private byte[] pendingPdf;
    private int pendingDocumentId;
    private final ActivityResultLauncher<String> saveDocument = registerForActivityResult(
        new ActivityResultContracts.CreateDocument("application/pdf"), uri -> {
            byte[] bytes = pendingPdf;
            int id = pendingDocumentId;
            pendingPdf = null;
            if (bytes == null) return;
            String result = uri == null ? "cancelled" : "failed";
            if (uri != null) {
                try (java.io.OutputStream output = getContentResolver().openOutputStream(uri)) {
                    if (output != null) { output.write(bytes); result = "saved"; }
                } catch (IOException ignored) { /* Keep the draft; expose only a save result. */ }
            }
            documentResult(id, result);
        });

    private void documentResult(int id, String status) {
        if (!isEntry()) return;
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('atmoshaper:document-result',{detail:{id:"
            + id + ",status:" + JSONObject.quote(status) + "}}));", null);
    }

    /** No general JavaScript bridge: only main-frame packaged PDF bytes and a
     * user-visible Android save/print dialog. No path or network target is accepted. */
    private void installDocumentPort() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        WebViewCompat.addWebMessageListener(webView, "AtmoShaperDocuments",
            Collections.singleton("https://appassets.androidplatform.net"), (view, message, origin, mainFrame, reply) -> {
                if (!mainFrame || !isEntry()) return;
                int id = 0;
                try {
                    String raw = message.getData();
                    if (raw == null || raw.length() > 8 * 1024 * 1024 + 1024) return;
                    JSONObject request = new JSONObject(raw);
                    String type = request.optString("type");
                    if ("print".equals(type)) {
                        PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
                        if (manager != null) manager.print("AtmoShaper working draft", webView.createPrintDocumentAdapter("AtmoShaper working draft"), null);
                        return;
                    }
                    id = request.getInt("id");
                    if (!"save-pdf".equals(type) || id <= 0) return;
                    if (pendingPdf != null) { documentResult(id, "failed"); return; }
                    String filename = request.getString("filename");
                    if (!filename.matches("atmoshaper-[a-z-]+-working-draft-[0-9-]+\\.pdf")) { documentResult(id, "failed"); return; }
                    byte[] bytes = Base64.decode(request.getString("data"), Base64.NO_WRAP);
                    if (bytes.length < 5 || bytes.length > 6 * 1024 * 1024
                        || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F' || bytes[4] != '-') { documentResult(id, "failed"); return; }
                    pendingDocumentId = id;
                    pendingPdf = bytes;
                    saveDocument.launch(filename);
                } catch (Exception ignored) { pendingPdf = null; if (id > 0) documentResult(id, "failed"); }
            });
    }

    private void closeFullscreen() {
        if (fullscreenView == null) return;
        ((FrameLayout) webView.getParent()).removeView(fullscreenView);
        fullscreenView = null;
        webView.setVisibility(View.VISIBLE);
        new WindowInsetsControllerCompat(getWindow(), webView).show(WindowInsetsCompat.Type.systemBars());
        if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
    }

    /** Only the packaged origin/path can load; all other resources fail locally. */
    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme())
            && "appassets.androidplatform.net".equals(uri.getHost())
            && uri.getPort() == -1 && uri.getUserInfo() == null
            && uri.getPath() != null && uri.getPath().startsWith("/assets/core/");
    }

    /** Hash navigation must not invalidate an otherwise exact packaged entry. */
    private boolean isEntry() {
        if (webView == null || webView.getUrl() == null) return false;
        Uri uri = Uri.parse(webView.getUrl());
        return isLocal(uri) && "/assets/core/index.html".equals(uri.getPath()) && uri.getQuery() == null;
    }

    /** Only first-party page destinations can open the connected app window.
     * They remain subject to the website's ordinary session/authorization. */
    private static boolean isWebsitePage(Uri uri) {
        if (!"https".equals(uri.getScheme()) || !"www.atmoshaper.com".equals(uri.getHost())
            || uri.getPort() != -1 || uri.getUserInfo() != null || uri.getPath() == null) return false;
        String path = uri.getPath();
        if ("/".equals(path)) return true;
        for (String prefix : new String[]{"account", "calendar", "login", "register", "onboarding", "wellness", "notes", "education", "anatomime", "anatomy", "book", "browse", "help", "music", "settings", "admin", "tools", "about", "pricing", "support", "roadmap", "legal", "forgot-password", "reset-password", "verify-email"}) {
            if (path.equals("/" + prefix) || path.startsWith("/" + prefix + "/")) return true;
        }
        return false;
    }

    private boolean isOnline() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        NetworkCapabilities capabilities = manager == null ? null : manager.getNetworkCapabilities(manager.getActiveNetwork());
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    /** Origin verification belongs to the browser/Digital Asset Links, never a
     * hidden WebView bypass. An unavailable browser fails with its own dialog. */
    private void openWebsite(Uri uri) {
        if (!isWebsitePage(uri)) return;
        if (websiteLauncher == null) websiteLauncher = new TwaLauncher(this);
        websiteLauncher.launch(new TrustedWebActivityIntentBuilder(uri), new QualityEnforcer(), null, null,
            TwaLauncher.getBlockedDialogFallbackStrategy("a compatible browser"));
    }

    /** Public tool intent only: a fixed route set and bounded query, not an
     * incoming page URL, credential or executable script. */
    private void receiveRoute(Intent intent) {
        Uri uri = intent == null ? null : intent.getData();
        if (uri == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || !"atmoshaper".equals(uri.getScheme())
            || !"tool".equals(uri.getHost()) || uri.getPort() != -1 || uri.getUserInfo() != null) return;
        String value = uri.getQueryParameter("path");
        if (value == null || value.length() > 1024 || !value.startsWith("/") || value.startsWith("//")
            || value.matches(".*[\\\\#\\p{Cntrl}].*")) return;
        Uri route = Uri.parse(value);
        String path = route.getPath();
        for (String allowed : new String[]{"/", "/clock", "/chimer", "/music", "/downloads", "/wellness/breathing", "/account/offline-access", "/tools/business-planner", "/tools/business-planner/income", "/tools/business-planner/break-even", "/tools/business-planner/launch-checklist", "/tools/business-planner/service-menu", "/tools/business-planner/plan-outline", "/tools/business-planner/add-on-profit"}) {
            if (allowed.equals(path)) {
                Uri.Builder canonical = new Uri.Builder().path(path);
                if ("/clock".equals(path) || "/chimer".equals(path)) {
                    if ("background".equals(route.getQueryParameter("panel"))) canonical.appendQueryParameter("panel", "background");
                    if ("music".equals(route.getQueryParameter("source"))) canonical.appendQueryParameter("source", "music");
                    if ("/music".equals(route.getQueryParameter("returnTo"))) canonical.appendQueryParameter("returnTo", "/music");
                }
                pendingRoute = canonical.build().toString();
                return;
            }
        }
    }

    private void deliverRoute() {
        if (pendingRoute == null || !isEntry()) return;
        String path = JSONObject.quote(pendingRoute); pendingRoute = null;
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('atmoshaper:native-navigation',{detail:" + path + "}));", null);
    }

    /** Only these existing public audio paths may use the native HTTP client. */
    private static boolean isMedia(Uri uri) {
        String path = uri.getEncodedPath();
        return "https".equals(uri.getScheme()) && "media.atmoshaper.com".equals(uri.getHost())
            && uri.getPort() == -1 && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
            && path != null && !path.toLowerCase(java.util.Locale.ROOT).matches(".*(%2f|%5c|%2e|\\\\|\\.\\.).*")
            && (path.startsWith("/atmosphere/generative-fm/") || path.startsWith("/atmosphere/observable-streams-vsco-adaptation/") || path.startsWith("/atmosphere/atmoshaper/v1/audio/"))
            && (path.endsWith(".json") || path.endsWith(".ogg"));
    }

    /** No redirects/cookies/credentials. Foreign content never becomes a page
     * or script; the client additionally enforces media type, byte and hash limits. */
    private static WebResourceResponse download(Uri uri) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(uri.toString()).openConnection();
        boolean handedOff = false;
        try {
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(15000);
        if (connection.getResponseCode() != 200) { connection.disconnect(); throw new IOException("Media unavailable"); }
        String type = connection.getContentType();
        boolean json = uri.getPath().endsWith(".json");
        if (type == null || (json ? !type.startsWith("application/json") : !(type.startsWith("audio/") || type.startsWith("application/ogg") || type.startsWith("application/octet-stream")))) {
            connection.disconnect(); throw new IOException("Unexpected media type");
        }
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "https://appassets.androidplatform.net");
        headers.put("Cache-Control", "no-store");
        if (connection.getContentLengthLong() > 0) headers.put("Content-Length", Long.toString(connection.getContentLengthLong()));
        WebResourceResponse response = new WebResourceResponse(json ? "application/json" : "audio/ogg", json ? "utf-8" : null, 200, "OK", headers,
            new FilterInputStream(connection.getInputStream()) {
                @Override public void close() throws IOException { try { super.close(); } finally { connection.disconnect(); } }
            });
        handedOff = true;
        return response;
        } finally {
            // Until a response owns the stream, setup failures belong here.
            if (!handedOff) connection.disconnect();
        }
    }

    /** Untrusted custom-scheme input is data only. Signature, install nonce and
     * current challenge are verified in the bundled app before durable acceptance. */
    private void receiveReceipt(Intent intent) {
        Uri uri = intent == null ? null : intent.getData();
        if (uri == null || !Intent.ACTION_VIEW.equals(intent.getAction()) || !"atmoshaper".equals(uri.getScheme())
            || !"offline-access".equals(uri.getHost()) || uri.getPort() != -1 || uri.getUserInfo() != null) return;
        String receipt = uri.getQueryParameter("receipt");
        if (receipt != null && receipt.length() <= 24000 && receipt.matches("[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+")) pendingReceipt = receipt;
    }

    private void deliverReceipt() {
        if (pendingReceipt == null || !isEntry()) return;
        String value = JSONObject.quote(pendingReceipt);
        pendingReceipt = null;
        webView.evaluateJavascript("window.atmoOfflineReceipt=" + value + ";window.dispatchEvent(new CustomEvent('atmoshaper:offline-access',{detail:" + value + "}));", null);
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        receiveReceipt(intent);
        receiveRoute(intent);
        // Do not replay a consumed return URI if Android recreates the Activity.
        intent.setData(null);
        setIntent(intent);
        deliverReceipt();
        deliverRoute();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        if (pendingReceipt != null) state.putString("offline.pendingReceipt", pendingReceipt);
        if (pendingRoute != null) state.putString("offline.pendingRoute", pendingRoute);
        super.onSaveInstanceState(state);
    }

    @SuppressLint("SetJavaScriptEnabled") // Executes the bundled React tools only.
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null) pendingReceipt = state.getString("offline.pendingReceipt");
        if (state != null) pendingRoute = state.getString("offline.pendingRoute");
        boolean connectedStart = state == null && Intent.ACTION_MAIN.equals(getIntent().getAction()) && isOnline();
        receiveReceipt(getIntent());
        receiveRoute(getIntent());
        getIntent().setData(null);
        // Match Clock's existing keep-awake default while these focused tools
        // are visible. Android releases this with the Activity's window.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xff171616);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), root);
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBlockNetworkLoads(true);
        CookieManager.getInstance().setAcceptCookie(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.setBackgroundColor(0xff171616);
        installDocumentPort();
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) { callback.onCustomViewHidden(); return; }
                fullscreenView = view;
                fullscreenCallback = callback;
                webView.setVisibility(View.GONE);
                root.addView(view, new FrameLayout.LayoutParams(-1, -1));
                new WindowInsetsControllerCompat(getWindow(), root).hide(WindowInsetsCompat.Type.systemBars());
            }
            @Override public void onHideCustomView() { closeFullscreen(); }
        });
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if ("GET".equals(request.getMethod()) && isLocal(request.getUrl())) {
                    WebResourceResponse response = assets.shouldInterceptRequest(request.getUrl());
                    if (response != null) return response;
                }
                if (!request.isForMainFrame() && "GET".equals(request.getMethod()) && isMedia(request.getUrl())) {
                    try { return download(request.getUrl()); } catch (IOException ignored) { /* Explicit download retry is the UI boundary. */ }
                }
                // Never fall through to networking for a missing/untrusted asset.
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (request.isForMainFrame() && isEntry() && isWebsitePage(uri)) {
                    openWebsite(uri);
                    return true;
                }
                return !isLocal(request.getUrl());
            }

            @Override public void onPageFinished(WebView view, String url) { deliverReceipt(); deliverRoute(); }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (fullscreenView != null) closeFullscreen();
                else if (webView.canGoBack()) webView.goBack();
                else finish();
            }
        });
        // Incoming intents/extras never choose the WebView URL or executable code.
        webView.loadUrl(ENTRY);
        if (connectedStart) webView.post(() -> openWebsite(Uri.parse("https://www.atmoshaper.com/?android_app=1")));
    }

    @Override
    protected void onDestroy() {
        if (websiteLauncher != null) websiteLauncher.destroy();
        webView.destroy();
        super.onDestroy();
    }
}
