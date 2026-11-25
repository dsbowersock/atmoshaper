package com.atmoshaper.app

import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.io.IOException

/** Native Home owns Clock and breathing navigation. Previous tools retain their
 * existing separate host and open through explicit actions. */
class HomeActivity : ComponentActivity() {
    private val breathingGuide by viewModels<BreathingGuideViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
        )
        setContent {
            HomeTheme {
                Home(this, breathingGuide, onOpenPreviousTools = ::openPreviousTools, onOpenTimer = ::openTimer)
            }
        }
    }

    /** Keep the previous launcher's choice of connected or packaged Home. */
    private fun openPreviousTools() {
        startActivity(Intent(Intent.ACTION_MAIN).setClass(this, MainActivity::class.java))
    }

    private fun openTimer() {
        startActivity(Intent(this, NativeTimerActivity::class.java))
    }

}

private enum class HomeTool(
    @StringRes val label: Int,
    @DrawableRes val icon: Int,
    val face: Color,
    val edge: Color,
) {
    // Native equivalents of the website's glow, ctaBlue, cta, calendar,
    // secondary and default variants. Keep the faces deep enough for light text.
    Music(R.string.home_music, R.drawable.home_music, Color(0xFF7B421C), Color(0xFF28211C)),
    Clock(R.string.home_clock, R.drawable.home_clock, Color(0xFF3F5CC1), Color(0xFF542F99)),
    Wellness(R.string.home_wellness, R.drawable.home_wellness, Color(0xFF8F31A8), Color(0xFF3E4DB0)),
    Calendar(R.string.home_calendar, R.drawable.home_calendar, Color(0xFF337143), Color(0xFF4D572A)),
    Study(R.string.home_study, R.drawable.home_study, Color(0xFFA54E15), Color(0xFF793515)),
    Practice(R.string.home_practice, R.drawable.home_practice, Color(0xFFAD3919), Color(0xFF8E3A17)),
}

@Composable
private fun Home(
    activity: HomeActivity,
    breathingGuide: BreathingGuideViewModel,
    onOpenPreviousTools: () -> Unit,
    onOpenTimer: () -> Unit,
) {
    var tool by rememberSaveable { mutableStateOf<HomeTool?>(null) }
    var showBreathing by rememberSaveable { mutableStateOf(false) }
    val selectedTool = tool
    val gridState = rememberLazyGridState()
    if (showBreathing) {
        BackHandler { showBreathing = false }
        NativeBreathingScreen(breathingGuide, onClose = { showBreathing = false })
        return
    }
    if (selectedTool == HomeTool.Clock) {
        ClockScreen(activity, onClose = { tool = null }, onOpenTimer = onOpenTimer)
        return
    }
    BackHandler(enabled = selectedTool != null) { tool = null }

    Surface(color = MaterialTheme.colorScheme.background, modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).imePadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            val content = Modifier.widthIn(max = 680.dp).fillMaxWidth()
            if (selectedTool == null) {
                val scaledCardWidth = 146.dp * LocalDensity.current.fontScale.coerceAtLeast(1f)
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(scaledCardWidth),
                    state = gridState,
                    modifier = content,
                    contentPadding = PaddingValues(20.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Wordmark()
                            Text(stringResource(R.string.home_intro), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            OpenBreathing { showBreathing = true }
                            Heading(stringResource(R.string.home_tools))
                        }
                    }
                    items(HomeTool.entries, key = { it.name }) { entry ->
                        ToolButton(entry, onClick = { tool = entry })
                    }
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        PreviousTools(onOpenPreviousTools)
                    }
                }
            } else {
                val title = stringResource(selectedTool.label)
                Column(
                    modifier = content.semantics { paneTitle = title }.verticalScroll(rememberScrollState()).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    TextButton(onClick = { tool = null }, modifier = Modifier.heightIn(min = 48.dp)) {
                        Text(stringResource(R.string.home_back))
                    }
                    Heading(title)
                    if (selectedTool == HomeTool.Wellness) {
                        OpenBreathing { showBreathing = true }
                    } else if (selectedTool == HomeTool.Music) {
                        NativeDownloads()
                        NativeAudioMixControls()
                        NativeAudioControls()
                    } else {
                        Text(stringResource(R.string.home_tool_unavailable), style = MaterialTheme.typography.titleMedium)
                    }
                    PreviousTools(onOpenPreviousTools)
                }
            }
        }
    }
}

@Composable
private fun OpenBreathing(onOpen: () -> Unit) {
    OutlinedButton(onClick = onOpen, modifier = Modifier.heightIn(min = 48.dp)) {
        Text(stringResource(R.string.breathing_open))
    }
}

@Composable
private fun ToolButton(tool: HomeTool, onClick: () -> Unit) {
    val shape = RoundedCornerShape(16.dp)
    val glow = tool == HomeTool.Music
    val face = if (glow && !isSystemInDarkTheme()) Color(0xFFAA4916) else tool.face
    val background = if (glow) {
        Brush.radialGradient(listOf(face, tool.edge))
    } else {
        Brush.linearGradient(listOf(face, tool.edge))
    }
    val highlight = if (glow) Color(0xFFE78643) else Color.White.copy(alpha = 0.20f)
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().heightIn(min = 112.dp)
            .shadow(if (glow) 6.dp else 2.dp, shape, ambientColor = face, spotColor = face)
            .background(background, shape),
        shape = shape,
        border = BorderStroke(1.dp, highlight),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Color(0xFFFFF9F2)),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 16.dp),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(painterResource(tool.icon), contentDescription = null, modifier = Modifier.size(28.dp))
            Text(stringResource(tool.label), textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun Heading(text: String) {
    Text(text, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.semantics { heading() })
}

@Composable
private fun PreviousTools(onOpen: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
        Text(stringResource(R.string.home_preview_details), color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedButton(onClick = onOpen, modifier = Modifier.heightIn(min = 48.dp)) {
            Text(stringResource(R.string.home_open_previous_tools))
        }
    }
}

@Composable
private fun Wordmark() {
    val assets = LocalContext.current.assets
    // The offline build packages the canonical wordmark and its public label.
    val wordmark = remember(assets) {
        try {
            assets.open("core/wordmark.png").use { BitmapFactory.decodeStream(it)?.asImageBitmap() }
        } catch (_: IOException) {
            null
        }
    }
    val wordmarkLabel = remember(assets) {
        try {
            assets.open("core/wordmark-label.txt").bufferedReader().use { it.readText() }
        } catch (_: IOException) {
            ""
        }
    }
    val label = wordmarkLabel.ifBlank { stringResource(R.string.app_name) }
    if (wordmark == null) {
        Heading(label)
    } else {
        Image(
            bitmap = wordmark,
            contentDescription = label,
            modifier = Modifier.widthIn(max = 224.dp).fillMaxWidth().semantics { heading() },
        )
    }
}

@Composable
internal fun HomeTheme(content: @Composable () -> Unit) {
    val type = FontFamily(Font(R.font.inter_regular), Font(R.font.inter_semibold, FontWeight.SemiBold))
    val typography = Typography(
        headlineSmall = TextStyle(fontFamily = type, fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 30.sp),
        titleMedium = TextStyle(fontFamily = type, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 23.sp),
        bodyLarge = TextStyle(fontFamily = type, fontSize = 16.sp, lineHeight = 23.sp),
        labelLarge = TextStyle(fontFamily = type, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 21.sp),
    )
    val colors = if (isSystemInDarkTheme()) {
        darkColorScheme(
            background = Color(0xFF1A1A1A), onBackground = Color(0xFFFAFAFA),
            surface = Color(0xFF212121), onSurface = Color(0xFFFAFAFA),
            onSurfaceVariant = Color(0xFFBEBBB8), primary = Color(0xFFF3B07D),
        )
    } else {
        lightColorScheme(
            background = Color(0xFFF9F7F5), onBackground = Color(0xFF171717),
            surface = Color(0xFFFFFCFA), onSurface = Color(0xFF171717),
            onSurfaceVariant = Color(0xFF695B54), primary = Color(0xFF87421D),
        )
    }
    MaterialTheme(colorScheme = colors, typography = typography, content = content)
}
