package com.atmoshaper.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.CookieManager;
import android.widget.FrameLayout;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

/** Locally packaged tools, bounded public media downloads and signed receipt
 * handoff. No remote page, account cookies or generic JavaScript bridge. */
public final class MainActivity extends ComponentActivity {
    private static final String ENTRY = "https://appassets.androidplatform.net/assets/core/index.html";
    private WebView webView;
    private String pendingReceipt;

    /** Only the packaged origin/path can load; all other resources fail locally. */
    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme())
            && "appassets.androidplatform.net".equals(uri.getHost())
            && uri.getPort() == -1 && uri.getUserInfo() == null
            && uri.getPath() != null && uri.getPath().startsWith("/assets/core/");
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
        return new WebResourceResponse(json ? "application/json" : "audio/ogg", json ? "utf-8" : null, 200, "OK", headers,
            new FilterInputStream(connection.getInputStream()) {
                @Override public void close() throws IOException { try { super.close(); } finally { connection.disconnect(); } }
            });
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
        if (pendingReceipt == null || webView == null || !ENTRY.equals(webView.getUrl())) return;
        String value = JSONObject.quote(pendingReceipt);
        pendingReceipt = null;
        webView.evaluateJavascript("window.atmoOfflineReceipt=" + value + ";window.dispatchEvent(new CustomEvent('atmoshaper:offline-access',{detail:" + value + "}));", null);
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        receiveReceipt(intent);
        deliverReceipt();
    }

    @SuppressLint("SetJavaScriptEnabled") // Executes the bundled React tools only.
    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        receiveReceipt(getIntent());
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
                if (request.isForMainFrame() && "https".equals(uri.getScheme()) && "www.atmoshaper.com".equals(uri.getHost())
                    && uri.getPort() == -1 && uri.getUserInfo() == null && "/account/offline-access".equals(uri.getPath())
                    && uri.getQueryParameter("device") != null && uri.getQueryParameter("device").matches("[A-Za-z0-9_-]{43}")
                    && uri.getQueryParameter("challenge") != null && uri.getQueryParameter("challenge").matches("[A-Za-z0-9_-]{43}")) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); } catch (android.content.ActivityNotFoundException ignored) { /* The user can retry with a browser installed. */ }
                    return true;
                }
                return !isLocal(request.getUrl());
            }

            @Override public void onPageFinished(WebView view, String url) { deliverReceipt(); }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack();
                else finish();
            }
        });
        // Incoming intents/extras never choose the WebView URL or executable code.
        webView.loadUrl(ENTRY);
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
