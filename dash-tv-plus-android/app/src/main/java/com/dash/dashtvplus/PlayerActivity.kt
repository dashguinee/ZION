package com.dash.dashtvplus

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.dash.dashtvplus.api.XtreamService
import com.dash.dashtvplus.databinding.ActivityPlayerBinding
import com.dash.dashtvplus.utils.Constants
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.LoadControl
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.PlaybackException
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.DefaultLoadControl
import com.google.android.exoplayer2.C
import com.google.android.exoplayer2.upstream.DefaultAllocator

/**
 * Player Activity
 * Handles HLS streaming with ExoPlayer
 */
class PlayerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPlayerBinding
    private lateinit var xtreamService: XtreamService

    private var player: ExoPlayer? = null
    private var portalUrl: String = ""
    private var username: String = ""
    private var password: String = ""
    private var channelStreamId: String = ""
    private var channelName: String = ""
    private var channelList: ArrayList<String> = ArrayList()
    private var currentChannelIndex: Int = 0

    private val overlayHandler = Handler(Looper.getMainLooper())
    private val hideOverlayRunnable = Runnable {
        hideChannelInfo()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Keep screen on during playback
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Get intent extras
        portalUrl = intent.getStringExtra(Constants.EXTRA_PORTAL_URL) ?: ""
        username = intent.getStringExtra(Constants.EXTRA_USERNAME) ?: ""
        password = intent.getStringExtra(Constants.EXTRA_PASSWORD) ?: ""
        channelStreamId = intent.getStringExtra(Constants.EXTRA_CHANNEL) ?: ""
        channelName = intent.getStringExtra("channel_name") ?: ""
        channelList = intent.getStringArrayListExtra(Constants.EXTRA_CHANNEL_LIST) ?: ArrayList()
        currentChannelIndex = intent.getIntExtra(Constants.EXTRA_CHANNEL_INDEX, 0)

        if (portalUrl.isEmpty() || username.isEmpty() || password.isEmpty() || channelStreamId.isEmpty()) {
            finish()
            return
        }

        xtreamService = XtreamService(portalUrl)

        setupUI()
        initializePlayer()
        playChannel(channelStreamId, channelName)
    }

    /**
     * Setup UI listeners
     */
    private fun setupUI() {
        // Channel navigation buttons
        binding.playerView.findViewById<View>(R.id.btnPrevChannel)?.setOnClickListener {
            playPreviousChannel()
        }

        binding.playerView.findViewById<View>(R.id.btnNextChannel)?.setOnClickListener {
            playNextChannel()
        }

        // Back button
        binding.playerView.findViewById<View>(R.id.exo_back)?.setOnClickListener {
            finish()
        }

        // Retry button
        binding.btnRetry.setOnClickListener {
            playChannel(channelStreamId, channelName)
        }
    }

    /**
     * Initialize ExoPlayer with optimized buffer settings
     */
    private fun initializePlayer() {
        // Custom load control for better buffering on slow networks
        val loadControl: LoadControl = DefaultLoadControl.Builder()
            .setAllocator(DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE))
            .setBufferDurationsMs(
                Constants.MIN_BUFFER_MS,
                Constants.MAX_BUFFER_MS,
                Constants.BUFFER_FOR_PLAYBACK_MS,
                Constants.BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
            )
            .setTargetBufferBytes(C.LENGTH_UNSET)
            .setPrioritizeTimeOverSizeThresholds(true)
            .build()

        player = ExoPlayer.Builder(this)
            .setLoadControl(loadControl)
            .build()
            .also { exoPlayer ->
                binding.playerView.player = exoPlayer

                // Add player listener
                exoPlayer.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        when (playbackState) {
                            Player.STATE_BUFFERING -> {
                                showLoading(true)
                            }
                            Player.STATE_READY -> {
                                showLoading(false)
                                hideError()
                            }
                            Player.STATE_ENDED -> {
                                // Stream ended
                            }
                            Player.STATE_IDLE -> {
                                // Player idle
                            }
                        }
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        showError(getString(R.string.error_playback))
                    }

                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        if (isPlaying) {
                            // Playing
                            showChannelInfo()
                        }
                    }
                })

                exoPlayer.playWhenReady = true
            }
    }

    /**
     * Play a channel
     */
    private fun playChannel(streamId: String, name: String) {
        channelStreamId = streamId
        channelName = name

        // Build stream URL
        val streamUrl = xtreamService.buildLiveStreamUrl(username, password, streamId)

        // Update channel info
        binding.tvChannelName.text = name
        binding.tvCurrentProgram.text = getString(R.string.now_playing)

        // Hide error state
        hideError()

        // Create media item
        val mediaItem = MediaItem.fromUri(streamUrl)

        // Set media and prepare
        player?.apply {
            setMediaItem(mediaItem)
            prepare()
            play()
        }

        // Show channel info overlay
        showChannelInfo()
    }

    /**
     * Play previous channel
     */
    private fun playPreviousChannel() {
        if (channelList.isEmpty()) return

        currentChannelIndex = if (currentChannelIndex > 0) {
            currentChannelIndex - 1
        } else {
            channelList.size - 1
        }

        val streamId = channelList[currentChannelIndex]
        playChannel(streamId, "Channel $currentChannelIndex")
    }

    /**
     * Play next channel
     */
    private fun playNextChannel() {
        if (channelList.isEmpty()) return

        currentChannelIndex = if (currentChannelIndex < channelList.size - 1) {
            currentChannelIndex + 1
        } else {
            0
        }

        val streamId = channelList[currentChannelIndex]
        playChannel(streamId, "Channel $currentChannelIndex")
    }

    /**
     * Show channel info overlay
     */
    private fun showChannelInfo() {
        binding.channelInfoOverlay.visibility = View.VISIBLE

        // Auto-hide after delay
        overlayHandler.removeCallbacks(hideOverlayRunnable)
        overlayHandler.postDelayed(hideOverlayRunnable, Constants.CHANNEL_INFO_OVERLAY_DELAY)
    }

    /**
     * Hide channel info overlay
     */
    private fun hideChannelInfo() {
        binding.channelInfoOverlay.visibility = View.GONE
    }

    /**
     * Show loading indicator
     */
    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
    }

    /**
     * Show error state
     */
    private fun showError(message: String) {
        binding.errorLayout.visibility = View.VISIBLE
        binding.tvErrorMessage.text = message
        binding.playerView.visibility = View.GONE
    }

    /**
     * Hide error state
     */
    private fun hideError() {
        binding.errorLayout.visibility = View.GONE
        binding.playerView.visibility = View.VISIBLE
    }

    /**
     * Release player resources
     */
    private fun releasePlayer() {
        player?.apply {
            playWhenReady = false
            release()
        }
        player = null
    }

    override fun onStop() {
        super.onStop()
        releasePlayer()
    }

    override fun onDestroy() {
        super.onDestroy()
        overlayHandler.removeCallbacks(hideOverlayRunnable)
        releasePlayer()
    }
}
