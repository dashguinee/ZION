package com.dash.dashtvplus.utils

object Constants {

    // App Info
    const val APP_NAME = "DASH TV+"
    const val APP_VERSION = "1.0.0"
    const val APP_PACKAGE = "com.dash.dashtvplus"

    // Intent Keys
    const val EXTRA_CHANNEL = "extra_channel"
    const val EXTRA_CHANNEL_LIST = "extra_channel_list"
    const val EXTRA_CHANNEL_INDEX = "extra_channel_index"
    const val EXTRA_PORTAL_URL = "extra_portal_url"
    const val EXTRA_USERNAME = "extra_username"
    const val EXTRA_PASSWORD = "extra_password"

    // Xtream API Actions
    const val ACTION_GET_LIVE_CATEGORIES = "get_live_categories"
    const val ACTION_GET_LIVE_STREAMS = "get_live_streams"
    const val ACTION_GET_VOD_CATEGORIES = "get_vod_categories"
    const val ACTION_GET_VOD_STREAMS = "get_vod_streams"
    const val ACTION_GET_SERIES_CATEGORIES = "get_series_categories"
    const val ACTION_GET_SERIES = "get_series"
    const val ACTION_GET_EPG = "get_simple_data_table"

    // Stream Types
    const val STREAM_TYPE_LIVE = "live"
    const val STREAM_TYPE_VOD = "movie"
    const val STREAM_TYPE_SERIES = "series"

    // User Status
    const val STATUS_ACTIVE = "Active"
    const val STATUS_EXPIRED = "Expired"
    const val STATUS_DISABLED = "Disabled"
    const val STATUS_BANNED = "Banned"

    // Network Timeouts (milliseconds)
    const val CONNECT_TIMEOUT = 30_000L
    const val READ_TIMEOUT = 30_000L
    const val WRITE_TIMEOUT = 30_000L

    // ExoPlayer Buffer Settings (milliseconds)
    const val MIN_BUFFER_MS = 10_000
    const val MAX_BUFFER_MS = 50_000
    const val BUFFER_FOR_PLAYBACK_MS = 2_500
    const val BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = 5_000

    // UI Delays
    const val SPLASH_DELAY = 2_000L
    const val CHANNEL_INFO_OVERLAY_DELAY = 5_000L
    const val SEARCH_DEBOUNCE_DELAY = 300L

    // Default Values
    const val DEFAULT_PORTAL_URL = "http://starshare.live:8080"
    const val DEFAULT_CATEGORY_ID = "all"
    const val DEFAULT_CATEGORY_NAME = "Toutes les chaînes"

    // Error Messages
    const val ERROR_NETWORK = "Erreur réseau"
    const val ERROR_AUTHENTICATION = "Erreur d'authentification"
    const val ERROR_INVALID_URL = "URL invalide"
    const val ERROR_PLAYBACK = "Erreur de lecture"
    const val ERROR_UNKNOWN = "Erreur inconnue"

    // Regex Patterns
    val URL_PATTERN = Regex("^https?://[\\w.-]+(:[0-9]+)?(/.*)?$")

    // Date Format
    const val DATE_FORMAT = "dd/MM/yyyy HH:mm"
    const val EPG_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss"
}
